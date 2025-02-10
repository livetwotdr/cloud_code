// Create new order
Parse.Cloud.define("processPayroll", async (request) => {
  const {
    userId,
    diamonds,
    bankName,
    bankAccount,
    firstName,
    lastName,
    name,
    method,
  } = request.params;

  const user = await new Parse.Query(Parse.User).get(userId, {
    useMasterKey: true,
  });
  if (!user) {
    throw new Error("User not found");
  }

  if (user.get("diamonds") < diamonds) {
    throw new Parse.Error(455, "Insufficient diamonds, aborting!");
  }

  const agent = await findAvailableAgent(user);
  if (!agent) {
    throw new Parse.Error(731, "No available agent found");
  }

  const {
    paymentAmount,
    paymentDiamonds,
    platformReward,
    withdrawDiamonds,
    withdrawAmount,
  } = calculatePayrollDetails(diamonds);

  const PayrollModel = Parse.Object.extend("Payroll");
  const payrollOrder = new PayrollModel();

  // Get host information directly from user object
  const host = user.get("host");
  const hostId = host ? host.id : null;

  payrollOrder.set("author", user);
  payrollOrder.set("authorId", user.id);
  payrollOrder.set("agent", agent);
  payrollOrder.set("agentId", agent.id);
  payrollOrder.set("host", host);
  payrollOrder.set("hostId", hostId);

  payrollOrder.set("paymentAmount", paymentAmount);
  payrollOrder.set("paymentDiamonds", paymentDiamonds);

  payrollOrder.set("withdrawAmount", withdrawAmount);
  payrollOrder.set("withdrawDiamonds", withdrawDiamonds);

  payrollOrder.set("earning", platformReward);
  payrollOrder.set("reward", platformReward);

  payrollOrder.set("bankName", bankName);
  payrollOrder.set("bankAccount", bankAccount);
  payrollOrder.set("firstName", firstName);
  payrollOrder.set("lastName", lastName);
  payrollOrder.set("name", name);
  payrollOrder.set("status", "pending");
  payrollOrder.set("paymentMethod", method);

  await payrollOrder.save(null, { useMasterKey: true });

  user.increment("diamonds", -diamonds);
  user.increment("diamondsPending", diamonds);
  await user.save(null, { useMasterKey: true });

  return payrollOrder;
});

async function findAvailableAgent(user) {
  const query = new Parse.Query("Agents");
  query.include("author");

  // Check if the user has an associated agency
  const agencyId = user.get("agencyId");
  if (agencyId) {
    try {
      const agency = await query.get(agencyId, { useMasterKey: true });
      const agentUser = agency.get("author");

      // Check if the agent can take orders and has less than 4 pending orders
      if (
        agentUser.get("payrollTakeOrders") &&
        (await countPendingOrders(agency)) < 4
      ) {
        return agency;
      }
    } catch (error) {
      console.error("Error fetching agency:", error);
      // Continue to find other available agents
    }
  }

  // Find the next available agent if user's agency is not available
  query.ascending("createdAt");

  try {
    const agents = await query.find({ useMasterKey: true });

    for (const agent of agents) {
      const agentUser = agent.get("author");

      // Check if the agent can take orders and has less than 4 pending orders
      if (
        agentUser.get("payrollTakeOrders") &&
        (await countPendingOrders(agent)) < 4
      ) {
        return agent;
      }
    }
  } catch (error) {
    console.error("Error fetching agents:", error);
  }

  // Return null if no available agent is found
  return null;
}

async function countPendingOrders(agent) {
  const PayrollModel = Parse.Object.extend("Payroll");
  const query = new Parse.Query(PayrollModel);
  query.equalTo("agent", agent);
  query.equalTo("status", "pending");
  return await query.count({ useMasterKey: true });
}

function calculatePayrollDetails(diamonds) {
  let paymentAmount, platformReward, withdrawDiamonds, withdrawAmount;
  const paymentDiamonds = diamonds;

  if (diamonds <= 500000) {
    paymentAmount = diamonds / 10000; // Convert to USD
    platformReward = Math.floor(diamonds * 0.05);
  } else if (diamonds <= 2000000) {
    paymentAmount = diamonds / 10000;
    platformReward = Math.floor(diamonds * 0.03);
  } else {
    paymentAmount = diamonds / 10000;
    platformReward = Math.floor(diamonds * 0.02);
  }

  withdrawDiamonds = diamonds - platformReward;
  withdrawAmount = withdrawDiamonds / 10000; // Convert to USD

  return {
    paymentAmount,
    paymentDiamonds,
    platformReward,
    withdrawDiamonds,
    withdrawAmount,
  };
}

// Payroll class
Parse.Cloud.beforeSave("Payroll", (request) => {
  const payrollOrder = request.object;

  if (!payrollOrder.get("status")) {
    payrollOrder.set("status", "pending");
  }

  if (!payrollOrder.get("createdAt")) {
    payrollOrder.set("createdAt", new Date());
  }

  if (!payrollOrder.get("expiresAt")) {
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 20);
    payrollOrder.set("expiresAt", expiresAt);
  }

  if(payrollOrder.get("status") === "refunded"){
    const refundedAt = new Date();
    payrollOrder.set("refundedAt", refundedAt);
}
});

Parse.Cloud.define("payrollOrderPay", async (request) => {
  const { orderId, file } = request.params;

  const payrollOrder = await new Parse.Query("Payroll").get(orderId);

  if (!payrollOrder) {
    throw new Parse.Error(Parse.Error.OBJECT_NOT_FOUND, "Order not found");
  }

  const timeNow = new Date();

  const expiresAt = timeNow;
  expiresAt.setHours(expiresAt.getHours() + 2);

  payrollOrder.set("status", "confirmation");
  payrollOrder.set("expiresAt", expiresAt);
  payrollOrder.set("paidAt", timeNow);

  if (file) {
    const fileObject = new Parse.File("payment_proof.jpg", { base64: file });
    await fileObject.save();
    payrollOrder.set("paymentProofFile", fileObject);
  }

  await payrollOrder.save(null, { useMasterKey: true });
  return payrollOrder;
});

Parse.Cloud.define("confirmPayrollPayment", async (request) => {
  const { orderId } = request.params;

  const payrollOrder = await new Parse.Query("Payroll").get(orderId);

  if (!payrollOrder) {
    throw new Parse.Error(Parse.Error.OBJECT_NOT_FOUND, "Order not found");
  }

  payrollOrder.set("status", "paid");
  payrollOrder.set('paidType', "host"); // auto, host, support

  await payrollOrder.save(null, { useMasterKey: true });
  return payrollOrder;
});

Parse.Cloud.define("abandonOrder", async (request) => {
  const { orderId, reason, category, file, remark } = request.params;
  const payrollOrder = await new Parse.Query("Payroll").get(orderId);

  if (!payrollOrder) {
    throw new Parse.Error(Parse.Error.OBJECT_NOT_FOUND, "Order not found");
  }

  payrollOrder.set({
    reason,
    category,
    ...(remark && { remark }),
  });

  if (category === "myReasons") {
    const agent = payrollOrder.get("agent");
    const abandonedOrders = await new Parse.Query("Payroll")
      .equalTo("agentId", payrollOrder.get("agentId"))
      .equalTo("status", "abandoned")
      .greaterThan("updatedAt", new Date(Date.now() - 24 * 60 * 60 * 1000))
      .count();

    if (abandonedOrders >= 10) {
      throw new Parse.Error(
        732,
        "You have exceeded the maximum number of abandoned orders in 24 hours"
      );
    }

    payrollOrder.set("status", "abandoned");

    if (abandonedOrders === 9) {
      agent.set(
        "payrollDisabledUntil",
        new Date(Date.now() + 8 * 60 * 60 * 1000)
      );
      await agent.save(null, { useMasterKey: true });
    }
  } else if (category === "payeeReasons") {
    payrollOrder.set("status", "rejected");
  } else {
    throw new Parse.Error(Parse.Error.INVALID_QUERY, "Invalid category");
  }

  if (file) {
    const fileObject = new Parse.File("abadon_proof.jpg", { base64: file });
    await fileObject.save();
    payrollOrder.set("abadonProofFile", fileObject);
  }

  await payrollOrder.save(null, { useMasterKey: true });

  return payrollOrder;
});

Parse.Cloud.define("payrollOrderUpdateProblem", async (request) => {
  const { orderId, file } = request.params;

  const payrollOrder = await new Parse.Query("Payroll").get(orderId);

  if (!payrollOrder) {
    throw new Parse.Error(Parse.Error.OBJECT_NOT_FOUND, "Order not found");
  }

  payrollOrder.set("problemStatus", "review"); // waiting, review, (completed | refused)

  if (file) {
    const fileObject = new Parse.File("problem_proof.jpg", { base64: file });
    await fileObject.save();
    payrollOrder.set("problemProofFile", fileObject);
  }

  await payrollOrder.save(null, { useMasterKey: true });
});

Parse.Cloud.define("payrollOrderRefund", async (request) => {

  const { orderId } = request.params;

  const payrollOrder = await new Parse.Query("Payroll").get(orderId);

  if (!payrollOrder) {
    throw new Parse.Error(Parse.Error.OBJECT_NOT_FOUND, "Order not found");
  }

  try {

    payrollOrder.set("status", "refunded");

    await payrollOrder.save(null, { useMasterKey: true });

    return payrollOrder;
  } catch (error) {
    console.error("Failed in Payroll:", error);
    throw new Parse.Error(error);
  }
});


Parse.Cloud.define("payrollOrderPaymentNotReceived", async (request) => {

    const { orderId } = request.params;
  
    const payrollOrder = await new Parse.Query("Payroll").get(orderId);
  
    if (!payrollOrder) {
      throw new Parse.Error(Parse.Error.OBJECT_NOT_FOUND, "Order not found");
    }
  
    try {
  
      payrollOrder.set("status", "problem");
      payrollOrder.set("problemStatus", "waiting"); // waiting, review, (completed | refused)
  
      await payrollOrder.save(null, { useMasterKey: true });

      return payrollOrder;
    } catch (error) {
      console.error("Failed in Payroll:", error);
      throw new Parse.Error(error);
    }
  });


// PayrollStats class
Parse.Cloud.afterSave("Payroll", async (request) => {
  const payrollOrder = request.object;
  const agentId = payrollOrder.get("agentId");
  const authorId = payrollOrder.get("authorId");
  const date = payrollOrder.get("createdAt");

  let agent;

  try {
    agent = await new Parse.Query("Agents")
      .include("author")
      .get(agentId, { useMasterKey: true });
  } catch (error) {
    console.error("Error fetching agent:", error);
    return; // Exit if we can't fetch the agent
  }

  if (payrollOrder.get("status") === "paid") {

    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));

    const statsQuery = new Parse.Query("PayrollStats")
      .equalTo("agentId", agent.id)
      .equalTo("date", startOfDay);

    let stats = await statsQuery.first();

    if (!stats) {
      stats = new Parse.Object("PayrollStats");
      stats.set("agent", agent);
      stats.set("agentId", agent.id);
      stats.set("author", agent.get("author"));
      stats.set("authorId", agent.get("authorId"));
      stats.set("date", startOfDay);
    }

    stats.increment("completedOrders", 1);
    stats.increment("paymentAmount", payrollOrder.get("paymentAmount"));
    stats.increment("paymentDiamonds", payrollOrder.get("paymentDiamonds"));
    stats.increment("withdrawDiamonds", payrollOrder.get("withdrawDiamonds"));
    stats.increment("withdrawAmount", payrollOrder.get("withdrawAmount"));
    stats.increment("earning", payrollOrder.get("earning"));
    stats.increment("reward", payrollOrder.get("reward"));

    const params = {
      type: "payroll_paid",
      earning: payrollOrder.get("earning"),
      diamonds: payrollOrder.get("paymentDiamonds"),
      receiverId: agent.get("authorId"),
      senderId: authorId,
    };

    const paramsPush = {
        type: "payrollOrderPayReceived",
        senderId: authorId,
        receiverId: agent.get("authorId"),
    };

    try {
      await Parse.Cloud.run("send_diamonds", params);
      await stats.save();

      await Parse.Cloud.run("sendPush", paramsPush);

    } catch (error) {
      console.error("Failed in Payroll:", error);
    }
  } else if(payrollOrder.get("status") === "refunded"){

    const params = {
        type: "payroll_refunded",
        earning: payrollOrder.get("earning"),
        diamonds: payrollOrder.get("paymentDiamonds"),
        receiverId: authorId,
        senderId: agent.get("authorId"),
    };

    await Parse.Cloud.run("send_diamonds", params);

  } else if(payrollOrder.get("status") === "confirmation"){

    const paramsPush = {
        type: "payrollOrderPaymentSent",
        senderId: agent.get("authorId") ,
        receiverId: authorId,
    };

    await Parse.Cloud.run("sendPush", paramsPush);

  } else if(payrollOrder.get("status") === "pending"){

    const paramsPush = {
        type: "payrollOrderNew",
        senderId:  authorId,
        receiverId: agent.get("authorId"),
    };

    await Parse.Cloud.run("sendPush", paramsPush);

  } else if(payrollOrder.get("status") === "problem"){

    const paramsPush = {
        type: payrollOrder.get("problemStatus") === "waiting" ? "payrollOrderProblem" : "payrollOrderProblemUpdate",
        senderId:  authorId,
        receiverId: agent.get("authorId"),
    };

    await Parse.Cloud.run("sendPush", paramsPush);

  }
});
