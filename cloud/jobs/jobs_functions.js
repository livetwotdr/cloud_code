// Check and update user status job
// Schedule the job to run every 5 minutes
Parse.Cloud.job("checkUserStatus", async function (request, status) {
  const query = new Parse.Query(Parse.User);
  query.lessThan("lastSeen", new Date(new Date().getTime() - 3 * 60000)); // 3 minutes ago
  query.notEqualTo("status", "offline");
  query.limit(1000); // Consider server capacity and number of users

  try {
    const usersToUpdate = await query.find({ useMasterKey: true });
    const updates = usersToUpdate.map(user => {
      const currentUserStatus = user.get("status");
      switch (currentUserStatus) {
        case 'online':
          user.set("status", 'recently');
          break;
        case 'recently':
          user.set("status", 'offline');
          break;
        default:
          // No action needed for other statuses
          break;
      }
      return user;
    });

    if (updates.length > 0) {
      await Parse.Object.saveAll(updates, { useMasterKey: true });
      console.info("Updated statuses successfully.");
      status.success("Updated statuses successfully.");
    } else {
      console.info("No statuses needed updating.");
      status.success("No statuses needed updating.");
    }
  } catch (error) {
    console.error("Error updating user statuses:", error);
    status.error("Failed to update user statuses due to an error.");
  }
});

// Schedule the job to run every 10 minutes
Parse.Cloud.job("expirePendingPayrolls", async function (request, status) {
  const { params, headers, log, message } = request;

  const PayrollModel = Parse.Object.extend("Payroll");
  const query = new Parse.Query(PayrollModel);

  // Set the time threshold to 20 minutes ago
  const twentyMinutesAgo = new Date(new Date().getTime() - 20 * 60 * 1000);

  query.lessThan('createdAt', twentyMinutesAgo);
  query.equalTo('status', 'pending');

  const batchSize = 100;
  let processedCount = 0;
  let expiredCount = 0;

  try {
      while (true) {
          query.limit(batchSize);
          const payrolls = await query.find({ useMasterKey: true });

          if (payrolls.length === 0) break;

          const updatePromises = payrolls.map(async (payroll) => {
            
              payroll.set('status', 'abandoned');
              payroll.set('category', 'myReasons');
              payroll.set('reason', 'myReasonsExpiration');
              
              
              // Refund diamonds to the user
              const user = payroll.get('author');
              const diamondsToRefund = payroll.get('paymentDiamonds');
              
              user.increment('diamonds', diamondsToRefund);
              user.increment('diamondsPending', -diamondsToRefund);
              await user.save(null, { useMasterKey: true });

              return payroll.save(null, { useMasterKey: true });
          });

          await Promise.all(updatePromises);

          processedCount += payrolls.length;
          expiredCount += payrolls.length;

          // Break if less than batchSize results returned
          if (payrolls.length < batchSize) break;
      }

      console.info(`Processed ${processedCount} payroll orders. Expired ${expiredCount} orders.`);
      status.success(`Processed ${processedCount} payroll orders. Expired ${expiredCount} orders.`);
      //message(`Processed ${processedCount} payroll orders. Expired ${expiredCount} orders.`);

  } catch (error) {
      console.error("Error in expirePendingPayrolls job:", error);
      status.error(`Error in expirePendingPayrolls job: ${error.message}`);
      //log.error(`Error in expirePendingPayrolls job: ${error.message}`);
      //throw error;
  }
});

// Schedule the job to run every 30 minutes
Parse.Cloud.job("autoConfirmPayrollOrders", async function (request, status) {
  //const { params, headers, log, message } = request;

  const query = new Parse.Query("Payroll");

  // Set the time threshold to 2 hours ago
  const twoHoursAgo = new Date(new Date().getTime() - 2 * 60 * 60 * 1000);

  query.lessThan('paidAt', twoHoursAgo);
  query.equalTo('status', 'confirmation');

  const batchSize = 100;
  let processedCount = 0;
  let paidCount = 0;

  try {
      while (true) {
          query.limit(batchSize);
          const payrolls = await query.find({ useMasterKey: true });

          if (payrolls.length === 0) break;

          const updatePromises = payrolls.map(async (payroll) => {

              payroll.set('status', 'paid');
              payroll.set('paidType', 'auto'); // auto, host, support

              return payroll.save(null, { useMasterKey: true });
          });

          await Promise.all(updatePromises);

          processedCount += payrolls.length;
          paidCount += payrolls.length;

          // Break if less than batchSize results returned
          if (payrolls.length < batchSize) break;
      }

      console.info(`Processed ${processedCount} payroll orders. Paid ${paidCount} orders.`);
      status.success(`Processed ${processedCount} payroll orders. Paid ${paidCount} orders.`);
      //message(`Processed ${processedCount} payroll orders. Paid ${paidCount} orders.`);
  } catch (error) {
      console.error("Error in autoConfirmPayrollOrders job:", error);
      status.error(`Error in autoConfirmPayrollOrders job: ${error.message}`);
      //log.error(`Error in autoConfirmPayrollOrders job: ${error.message}`);
      //throw error;
  }
});

