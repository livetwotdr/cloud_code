const { checkInviterRewards } = require("./rewared_invite_functions");

async function roomLogin(body, res) {
  // Check if required data is present
  if (!body.room_id || !body.user_account) {
    return res.status(400).send("Invalid request data");
  }

  const query = new Parse.Query("Stream");
  query.equalTo("liveId", body.room_id);

  try {
    const stream = await query.first({ useMasterKey: true });

    // Check if stream exists
    if (!stream) {
      return res.status(404).send("Stream not found");
    }

    const authorId = stream.get("authorId");
    const userAccount = body.user_account;

    // If the user is not the author, add them to the viewers
    if (authorId !== userAccount) {
      stream.addUnique("viewers", userAccount);
      stream.addUnique("viewersTotal", userAccount);
      stream.increment("viewersCount", 1);

      await stream.save(null, { useMasterKey: true });

    } else {
      // If the user is the author, update the author's live streaming status
      const author = stream.get("author");

      if (author) {
        author.set("isLiveStreaming", true);
        await author.save(null, { useMasterKey: true });
      }
    }

    // Successfully handled
    return res.status(200).send("1");

  } catch (error) {
    console.error("Error in roomLogin:", error);
    return res.status(500).send("Internal server error");
  }
}

async function roomLogout(body, res) {
  // Check if required data is present
  if (!body.room_id || !body.user_account) {
    return res.status(400).send("Invalid request data");
  }

  const query = new Parse.Query("Stream");
  query.equalTo("liveId", body.room_id);

  try {
    const stream = await query.first({ useMasterKey: true });

    // Check if stream exists
    if (!stream) {
      return res.status(404).send("Stream not found");
    }

    const authorId = stream.get("authorId");
    const userAccount = body.user_account;

    // If the user is not the author, add them to the viewers
    if (authorId !== userAccount) {
      stream.remove("viewers", userAccount);
      stream.increment("viewersCount", -1);

      await stream.save(null, { useMasterKey: true });

    } else {
      // If the user is the author, update the author's live streaming status
      const author = stream.get("author");

      if (author) {
        author.set("isLiveStreaming", false);
        await author.save(null, { useMasterKey: true });
      }
    }

    // Successfully handled
    return res.status(200).send("1");

  } catch (error) {
    console.error("Error in roomLogout:", error);
    return res.status(500).send("Internal server error");
  }
}

async function streamCreated(body, res) {
  if (!body.room_id || !body.create_time) {
    return res.status(400).send("Invalid request data");
  }

  const query = new Parse.Query("Stream");
  query.equalTo("liveId", body.room_id);

  try {
    const stream = await query.first({ useMasterKey: true });

    if (!stream) {
      return res.status(404).send("Stream not found");
    }

    const createTime = new Date(parseInt(body.create_time, 10) * 1000);

    stream.set("onGoing", true);
    stream.set("startTime", createTime);

    await stream.save(null, { useMasterKey: true });
    res.status(200).send("1");
  } catch (error) {
    console.error("Error in streamCreated:", error);
    res.status(500).send("Internal server error");
  }
}

async function streamClosed(body, res) {
  if (!body.room_id || !body.timestamp) {
    return res.status(400).send("Invalid request data");
  }

  const query = new Parse.Query("Stream");
  query.equalTo("liveId", body.room_id);
  query.include("author");

  try {
    const stream = await query.first({ useMasterKey: true });

    if (!stream) {
      return res.status(404).send("Stream not found");
    }

    const diamonds = stream.get("diamonds") || 0;
    const commissionDiamonds = Math.round((diamonds / 100) * 4);

    const author = stream.get("author");
    const agencyId = author.get("agencyId");

    const createdTime = stream.get("startTime");
    const closeTime = new Date(body.timestamp * 1000);

    const duration = (closeTime - createdTime) / 1000;

    stream.set("onGoing", false);
    stream.set("Duration", duration);
    stream.set("endTime", closeTime);

    if (agencyId) {

      const queryAgency = new Parse.Query("Agents");
      queryAgency.include("author");
      const agent = await queryAgency.get(agencyId, {useMasterKey: true});

      const agentAuthor = agent.get("author");

      if(agentAuthor){
        commissionDiamonds = calculateCommission(diamonds, agentAuthor.get("diamondsTotal") || 0);
      }

      stream.increment("commission_sent", commissionDiamonds);
    }

    await stream.save(null, { useMasterKey: true });

    await updateHostStream(stream, commissionDiamonds, duration, res);
    await checkInviterRewards(stream);
  } catch (error) {
    console.error("Error in streamClosed:", error);
    res.status(500).send("Internal server error");
  }
}

async function updateHostStream(stream, commissionDiamonds, duration, res) {
  const streamId = stream.id;
  const liveType = stream.get("type");
  const authorId = stream.get("authorId");
  const diamonds = stream.get("diamonds") || 0;


  try {
    // Update Hosts
    const userQueryAuthor = new Parse.Query(Parse.User);
    userQueryAuthor.equalTo("objectId", authorId);
    const author = await userQueryAuthor.first({ useMasterKey: true });

    const query = new Parse.Query("Hosts");
    query.equalTo("authorId", authorId);
    const result = await query.first({ useMasterKey: true });

    if (result) {
      result.addUnique("streams", streamId);
      result.increment("duration", duration);
      result.increment("diamonds", diamonds);

      if (author.get("agencyId")) {
        result.increment("commission_sent", commissionDiamonds);
      }

      if (liveType === "live") {
        result.increment("live_duration", duration);
      } else if (liveType === "live_multi") {
        result.increment("multi_duration", duration);
        result.increment("party_duration", duration);
      } else if (liveType === "audio") {
        result.increment("party_duration", duration);
        result.increment("audio_duration", duration);
      }

      await result.save(null, { useMasterKey: true });
    } else {
      const Host = Parse.Object.extend("Hosts");
      const host = new Host();
      host.set("author", author);
      host.set("inviterId", author.get("invitedByUser"));
      host.set("authorId", authorId);
      host.addUnique("streams", streamId);
      host.increment("duration", duration);
      host.increment("diamonds", diamonds);

      if (liveType === "live") {
        host.increment("live_duration", duration);
      } else if (liveType === "live_multi") {
        host.increment("multi_duration", duration);
        host.increment("party_duration", duration);
      } else if (liveType === "audio") {
        host.increment("party_duration", duration);
        host.increment("audio_duration", duration);
      }

      await host.save(null, { useMasterKey: true });

      author.set("host", host);
      author.set("hostId", host.id);
      
      if(author.get("role") === "user"){
        author.set("role", "host");
      }
     
      await author.save(null, { useMasterKey: true });
    }

    res.status(200).send("1");

    // Update HostStreamStats with detailed statistics
    await updateHostStreamStats(author, commissionDiamonds, duration, diamonds, streamId, liveType);
  } catch (error) {
    console.error("Error in updateHostStream:", error);
    res.status(500).send("Internal server error");
  }
}

async function updateHostStreamStats(
  author,
  commissionDiamonds,
  duration,
  diamonds,
  streamId,
  liveType
) {
  const today = new Date();
  const startOfDay = new Date(today.setHours(0, 0, 0, 0));

  // Update daily stats
  await updateStats(author, commissionDiamonds, startOfDay, duration, diamonds, streamId, liveType);
}

async function updateStats(
  author,
  commissionDiamonds,
  date,
  duration,
  diamonds,
  streamId,
  liveType
) {

  const query = new Parse.Query("HostStreamStats");
  query.equalTo("authorId", author.id);
  query.equalTo("date", date);

  const stats = await query.first({ useMasterKey: true });

  if (stats) {
    stats.increment("duration", duration);

    if (liveType === "live") {
      stats.increment("live_duration", duration);
      stats.increment("live_earning", diamonds);
    } else if (liveType === "live_multi") {
      stats.increment("multi_duration", duration);
      stats.increment("party_duration", duration);
      stats.increment("party_earning", diamonds);
    } else if (liveType === "audio") {
      stats.increment("party_duration", duration);
      stats.increment("audio_duration", duration);
      stats.increment("party_earning", diamonds);
    }

    if (author.get("agencyId")) {
      stats.increment("commission_sent", commissionDiamonds);
    }

    stats.increment("diamonds", diamonds);
    stats.addUnique("streams", streamId);
    await stats.save(null, { useMasterKey: true });
  } else {
    const HostStreamStats = Parse.Object.extend("HostStreamStats");
    const newStats = new HostStreamStats();
    newStats.set("author", author);
    newStats.set("authorId", author.id);
    newStats.set("host", author.get("host"));
    newStats.set("hostId", author.get("hostId"));
    newStats.set("date", date);
    newStats.set("duration", duration);

    if (author.get("agencyId")) {
      newStats.increment("commission_sent", commissionDiamonds);
    }

    if (liveType === "live") {
      newStats.increment("live_duration", duration);
      newStats.increment("live_earning", diamonds);
    } else if (liveType === "live_multi") {
      newStats.increment("party_duration", duration);
      newStats.increment("multi_duration", duration);
      newStats.increment("party_earning", diamonds);
    } else if (liveType === "audio") {
      newStats.increment("party_duration", duration);
      newStats.increment("audio_duration", duration);
      newStats.increment("party_earning", diamonds);
    }
    newStats.set("diamonds", diamonds);
    newStats.addUnique("streams", streamId);
    await newStats.save(null, { useMasterKey: true });
  }

  if (author.get("agencyId")) {
    await updateAgentStats(author, commissionDiamonds, date, diamonds, streamId);
  }
}

async function updateAgentStats(author, commissionDiamonds, date, diamonds, streamId) {

  const query = new Parse.Query("AgentStats");
  query.equalTo("agentId", author.get("agencyId"));
  query.equalTo("date", date);
  query.include("author");
  query.include("agent");

  const agentStats = await query.first({ useMasterKey: true });
  if (agentStats) {
    agentStats.increment("total_earning", diamonds);
    agentStats.increment("total_commission", commissionDiamonds);

    agentStats.increment("host_earning", diamonds);
    agentStats.increment("host_commission", commissionDiamonds);

    agentStats.addUnique("streams", streamId);
    await agentStats.save(null, { useMasterKey: true });

    if (commissionDiamonds > 0) {
      const agent = agentStats.get("agent");
      const inviterId = agent.get("inviterId");
      await updateAgentUser(
        "host_commission",
        author.id,
        agentStats.get("author").id,
        commissionDiamonds
      );

      // Check if the agent has an inviter
      if (inviterId) {
        const userQueryAuthor = new Parse.Query(Parse.User);
        const inviterAuthor = await userQueryAuthor.get(inviterId, { useMasterKey: true });

        if (inviterAuthor) {
            await updateInviterAgentStats(inviterAuthor, author.id, date, commissionDiamonds, streamId);
        }
      }
    }

  } else {

    const query = new Parse.Query("Agents");
    query.include("author");

    try {
      const agent = await query.get(author.get("agencyId"), {
        useMasterKey: true,
      });

      if (agent === null) {
        return;
      }

      const HostStreamStats = Parse.Object.extend("AgentStats");
      const newStats = new HostStreamStats();
      newStats.set("author", agent.get("author"));
      newStats.set("authorId", agent.get("authorId"));
      newStats.set("agent", agent);
      newStats.set("agentId", agent.id);

      // Commented out because we don't want to set the host object
      //newStats.set("host", author.get("host"));
      //newStats.set("hostId", author.get("hostId"));
      //newStats.addUnique("hosts", author.get("host"));

      newStats.addUnique("hostIds", author.get("hostId"));

      newStats.set("date", date);

      newStats.set("total_earning", diamonds);
      newStats.set("total_commission", commissionDiamonds);

      newStats.set("host_earning", diamonds);
      newStats.set("host_commission", commissionDiamonds);

      newStats.addUnique("streams", streamId);
      await newStats.save(null, { useMasterKey: true });

      if (commissionDiamonds > 0) {
        
        const inviterId = agent.get("inviterId");

        await updateAgentUser(
          "host_commission",
          author.id,
          agent.get("author").id,
          commissionDiamonds
        );

        // Check if the agent has an inviter
        if (inviterId) {
          const userQueryAuthor = new Parse.Query(Parse.User);
          const inviterAuthor = await userQueryAuthor.get(inviterId, { useMasterKey: true });

        if (inviterAuthor) {
            await updateInviterAgentStats(inviterAuthor, author.id, date, commissionDiamonds, streamId);
        }
      }
      }
    } catch (error) {
      console.error("Error in updateAgentStats:", error);
    }
  }
}

async function updateInviterAgentStats(author, senderId, date, diamonds, streamId) {
  
  const commissionDiamonds = Math.round((diamonds / 100) * 20);

  const query = new Parse.Query("AgentStats");
  query.equalTo("agentId", author.get("agentId"));
  query.equalTo("date", date);

  const agentStats = await query.first({ useMasterKey: true });
  if (agentStats) {
    agentStats.increment("total_earning", diamonds);
    agentStats.increment("total_commission", commissionDiamonds);

    agentStats.increment("agent_earning", diamonds);
    agentStats.increment("agent_commission", commissionDiamonds);

    agentStats.addUnique("streams", streamId);
    await agentStats.save(null, { useMasterKey: true });

    if (commissionDiamonds > 0) {
      await updateAgentUser(
        "agent_commission",
        senderId,
        author.id,
        commissionDiamonds
      );
    }

  } else {

    const query = new Parse.Query("Agents");
    query.include("author");

    try {
      const agent = await query.get(author.get("agentId"), {
        useMasterKey: true,
      });

      if (agent === null) {
        return;
      }

      const HostStreamStats = Parse.Object.extend("AgentStats");
      const newStats = new HostStreamStats();
      newStats.set("author", agent.get("author"));
      newStats.set("authorId", agent.get("authorId"));
      newStats.set("agent", agent);
      newStats.set("agentId", agent.id);

      newStats.set("date", date);

      newStats.set("total_earning", diamonds);
      newStats.set("total_commission", commissionDiamonds);

      newStats.set("agent_earning", diamonds);
      newStats.set("agent_commission", commissionDiamonds);

      newStats.addUnique("streams", streamId);
      await newStats.save(null, { useMasterKey: true });

      if (commissionDiamonds > 0) {
        await updateAgentUser(
          "agent_commission",
          senderId,
          author.id,
          commissionDiamonds
        );
      }
    } catch (error) {
      console.error("Error in updateAgentStats:", error);
    }
  }
}

async function updateAgentUser(
  commissionType,
  sender,
  receiver,
  diamondsCommission
) {

  const params = {
    type: commissionType,
    credits: 0,
    diamonds: diamondsCommission,
    receiverId: receiver,
    senderId: sender,
  };

  try {
    await Parse.Cloud.run("send_credits", params);
  } catch (error) {
    console.error("Failed to pay commission:", error);
  }
}

function calculateCommissionPercentage(totalEarnedDiamonds) {
  if (totalEarnedDiamonds >= 150000000) {
    return 20;
  } else if (totalEarnedDiamonds >= 50000000) {
    return 16;
  } else if (totalEarnedDiamonds >= 10000000) {
    return 8;
  } else {
    return 4;
  }
}

function calculateCommission(diamonds, totalEarnedDiamonds) {
  const percentage = calculateCommissionPercentage(totalEarnedDiamonds);
  return Math.round((diamonds / 100) * percentage);
}

module.exports = {
  streamCreated,
  streamClosed,
  roomLogin,
  roomLogout
};