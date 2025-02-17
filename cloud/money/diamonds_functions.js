const transactionTypes = {
    payrollPaid: "payroll_paid",
    payrollRefunded: "payroll_refunded"
};

Parse.Cloud.define("send_diamonds", async (request) => {

    const { type, credits, senderId, diamonds, earning, receiverId, payrollId } = request.params;

    try {
        const userReceiverQuery = new Parse.Query(Parse.User).equalTo("objectId", receiverId);
        const userQuery = new Parse.Query(Parse.User).equalTo("objectId", senderId);
    
        const [userReceiver, user] = await Promise.all([
          userReceiverQuery.first({ useMasterKey: true }),
          userQuery.first({ useMasterKey: true })
        ]);
    
        if (!user || !userReceiver) throw new Parse.Error(101, "User not found");
        if (user.get("accountDeleted")) throw new Parse.Error(340, "Account Deleted");
        if (user.get("activationStatus")) throw new Parse.Error(341, "Access denied, you have been blocked.");
    
        await processTransaction(type, user, userReceiver, credits, diamonds, earning, payrollId);
    
        return user;
      } catch (error) {
        throw new Parse.Error(error.code || 500, error.message || "Internal Server Error");
      }
});

async function processTransaction(type, user, userReceiver, credits, diamonds, earning, payrollId) {
    switch (type) {
        case transactionTypes.payrollPaid:
            userReceiver.increment("diamonds", diamonds);
            userReceiver.increment("diamondsTotal", diamonds);
            userReceiver.increment("diamondsPayrollEarn", earning);
            user.increment("diamondsPending", -diamonds);
        break;
        case transactionTypes.payrollRefunded:
            user.increment("diamonds", -diamonds);
            user.increment("diamondsTotal", -diamonds);
            user.increment("diamondsPayrollEarn", -earning);
            userReceiver.increment("diamonds", diamonds);
        break;
      default:
        throw new Parse.Error(400, "Invalid transaction type");
    }
  
    await user.save(null, { useMasterKey: true });
    await userReceiver.save(null, { useMasterKey: true });
  
    await saveTransaction(user, userReceiver, type, credits, diamonds, earning, payrollId);
  }

async function saveTransaction(user, userReceiver, type, credits, diamonds, earning, payrollId) {
    
    const Transactions = Parse.Object.extend("Transactions");
    const transaction = new Transactions();
  
    transaction.set("author", user);
    transaction.set("authorId", user.id);
    transaction.set("authorCredits", user.get("credit"));
    transaction.set("authorDiamonds", user.get("diamonds") || 0);
  
    transaction.set("receiver", userReceiver);
    transaction.set("receiverId", userReceiver.id);
    transaction.set("receiverCredits", userReceiver.get("credit"));
    transaction.set("receiverDiamonds", userReceiver.get("diamonds") || 0);
  
    transaction.set("status", "completed");
    transaction.set("type", type);
  
    transaction.set("credits", credits);
    transaction.set("diamondsPayrollEarn", earning);
    
    transaction.set("diamonds", diamonds);

    if (payrollId) {
        const payrollQuery = new Parse.Query("Payroll");
        const payroll = await payrollQuery.get(payrollId);
        transaction.set("payroll", payroll);
        transaction.set("payrollId", payrollId);
      }
  
    await transaction.save(null, { useMasterKey: true });
  
    return transaction;
  }