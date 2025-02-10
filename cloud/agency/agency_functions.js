Parse.Cloud.define("process_host_quit_request", async (request) => {
  const { action, requestId } = request.params;

  const messageQuery = new Parse.Query("SystemMessage");
  messageQuery.include(["author", "receiver", "agent", "invitation", "host"]);

  try {
    const message = await messageQuery.get(requestId);

    const author = message.get("author");
    const receiver = message.get("receiver");
    const host = message.get("host");
    const agent = message.get("agent");
    const invitation = message.get("invitation");

    if (action === "accepted") {
      // Remove agency association from host and author
      [host, author].forEach(async (user) => {
        user.unset("agency");
        user.unset("agencyId");
        await user.save(null, { useMasterKey: true });
      });

      // Update the agent's hostIds
      agent.remove("hostIds", host.id);
      await agent.save(null, { useMasterKey: true });
    }

    // Update invitation status
    invitation.set("invitationStatus", action);
    await invitation.save(null, { useMasterKey: true });

    // Create and save a new system message
    const systemMessage = new Parse.Object("SystemMessage");
    systemMessage.set({
      author: receiver,
      authorId: receiver.id,
      receiver: author,
      receiverId: author.id,
      agent: agent,
      agentId: agent.id,
      host: host,
      hostId: host.id,
      invitation: invitation,
      invitationId: invitation.id,
      type: message.get("type"),
      mainMessage: message,
      status: action,
      read: false,
    });
    await systemMessage.save(null, { useMasterKey: true });

    // Update the original message's relation and save
    message.set("relatedMessage", systemMessage);
    await message.save(null, { useMasterKey: true });

    return message;
  } catch (error) {
    console.error("Error in process_host_quit_request:", error);
    throw new Parse.Error(
      Parse.Error.SCRIPT_FAILED,
      "Failed to process host quit request"
    );
  }
});

Parse.Cloud.define("process_agency_request", async (request) => {
  const { action, requestId } = request.params;

  const messageQuery = new Parse.Query("SystemMessage");
  messageQuery.include(["author", "receiver", "agent", "invitation", "host"]);

  try {
    const message = await messageQuery.get(requestId);

    const author = message.get("author");
    const receiver = message.get("receiver");
    let host = message.get("host");
    const agent = message.get("agent");
    const invitation = message.get("invitation");

    if (action === "accepted") {
      if (host) {
        // Update existing host
        host.set({
          agency: agent,
          agencyId: agent.id,
        });
        await host.save(null, { useMasterKey: true });
      } else {
        // Create a new host if it doesn't exist
        const Host = Parse.Object.extend("Hosts");
        host = new Host();

        host.set({
          author: receiver,
          authorId: receiver.id,
          inviterId: receiver.get("invitedByUser"),
        });
        await host.save(null, { useMasterKey: true });

        // Update receiver with the new host information
        receiver.set({
          host: host,
          hostId: host.id,
          role: "host",
        });
      }

      // Update receiver with agency info and last agency date
      receiver.set({
        lastAgencyDate: new Date(),
        agency: agent,
        agencyId: agent.id,
      });
      await receiver.save(null, { useMasterKey: true });

      // Update agent's host list
      agent.addUnique("hostIds", host.id);
      await agent.save(null, { useMasterKey: true });
    }

    // Update invitation status
    invitation.set("invitationStatus", action);
    await invitation.save(null, { useMasterKey: true });

    // Create and save the system message
    const systemMessage = new Parse.Object("SystemMessage");
    systemMessage.set({
      author: receiver,
      authorId: receiver.id,
      receiver: author,
      receiverId: author.id,
      agent: agent,
      agentId: agent.id,
      host: host,
      hostId: host.id,
      invitation: invitation,
      invitationId: invitation.id,
      type: message.get("type"),
      status: action,
      mainMessage: message,
      read: false,
    });
    await systemMessage.save(null, { useMasterKey: true });

    // Link the original message to the new system message
    message.set("relatedMessage", systemMessage);
    await message.save(null, { useMasterKey: true });

    return message;
  } catch (error) {
    console.error("Error in process_agency_request:", error);
    throw new Parse.Error(
      Parse.Error.SCRIPT_FAILED,
      "Failed to process agency request"
    );
  }
});

Parse.Cloud.define("process_become_agent", async (request) => {
    const { authorId, agentId, inviterId } = request.params;

    const userQueryAuthor = new Parse.Query(Parse.User);

    try {
        // Fetch the author user
        const author = await userQueryAuthor.get(authorId, { useMasterKey: true });

        // Create a new agent object
        const agent = new Parse.Object("Agents");
        agent.set({
            author: author,
            authorId: author.id,
            inviterId: inviterId || null, // Set inviterId only if provided
        });

        // Save the new agent
        await agent.save(null, { useMasterKey: true });

        // If agentId is provided, add the new agent to the inviter's list
        if (agentId) {
            const inviterAgentQuery = new Parse.Query("Agents");
            const inviterAgent = await inviterAgentQuery.get(agentId, { useMasterKey: true });

            if (inviterAgent) {
                inviterAgent.addUnique("invitedAgents", agent.id);
                await inviterAgent.save(null, { useMasterKey: true });
            }
        }

        // Update the author with the new agent information
        author.set({
            agent: agent,
            agentId: agent.id,
        });

        await author.save(null, { useMasterKey: true });

        return agent;

    } catch (error) {
        console.error("Error in process_become_agent:", error);
        throw new Parse.Error(Parse.Error.SCRIPT_FAILED, "Failed to become agent");
    }
});


Parse.Cloud.define("exchange_diamonds_credits", async (request) => {

    const transactionTypes = {
        exchange: "credits_exchange",
      };

      const { authorId , credits, diamonds} = request.params;

      const authorQuery = new Parse.Query(Parse.User);
    
      try {
        
        const author = authorQuery.get(authorId, { useMasterKey: true });

        if (author.get("diamonds") < diamonds) {

            throw new Parse.Error(441, "Insufficient funds");
        }

        author.increment("diamonds", -diamonds);

        author.increment("credit", credits);
        author.increment("creditReceived", credits);

        await author.save(null, { useMasterKey: true });

        const transaction = await saveTransaction(author, author, credits, diamonds, transactionTypes, transactionTypes.exchange);
        await saveMessageSystem(author, author, transaction, transactionTypes.exchange);

      } catch (error) {
        throw new Parse.Error(error);
      }


});

Parse.Cloud.define("coins_trading_transfer", async (request) => {

    const transactionTypes = {
        trading: "credits_trading",
    };

    const { authorId, receiverId, amount } = request.params;

    const authorQuery = new Parse.Query(Parse.User);
    const receiverQuery = new Parse.Query(Parse.User);

    try {

        const [author, receiver] = await Promise.all([
            authorQuery.get(authorId, { useMasterKey: true }),
            receiverQuery.get(receiverId, { useMasterKey: true })
        ]);
    
        if (author.get("creditsTrade") < amount) {

            throw new Parse.Error(441, "Insufficient funds");
        }

        author.addUnique("tradingReceivers", receiver.id);
        
        // Remove from authors's account
        author.increment("creditsTrade", -amount);
        author.increment("creditsTradeSent", amount);

        // Add to receiver's account
        receiver.increment("credit", amount);
        receiver.increment("creditReceived", amount);

        await author.save(null, { useMasterKey: true });
        await receiver.save(null, { useMasterKey: true });

        const trading = await saveTrading(author, receiver, amount);
        const transaction = await saveTransaction(author, receiver, amount, trading, transactionTypes, transactionTypes.trading);
        await saveMessageSystem(author, receiver, transaction, transactionTypes.trading);

        return author;
        
    } catch (error) {
        throw new Parse.Error(error);
    }

});

async function saveMessageSystem(author, receiver, transaction, type) {
  const systemMessage = new Parse.Object("SystemMessage");

  systemMessage.set({
      author,
      authorId: author.id,
      receiver: receiver,
      receiverId: receiver.id,
      transaction,
      transactionId: transaction.id,
      read: false,
      type: type,
      status: "accepted"
  });

  await systemMessage.save(null, { useMasterKey: true });
}

async function saveTrading(author, receiver, amount) {

    const Trading = Parse.Object.extend("Trading");
    const trading = new Trading();
  
    trading.set("author", author);
    trading.set("authorId", author.id);
  
    trading.set("receiver", receiver);
    trading.set("receiverId", receiver.id);

    trading.set("amount", amount);

    trading.set("authorAfter", author.get("creditsTrade") || 0);
    trading.set("receiverAfter", receiver.get("credit") || 0);

    await trading.save(null, { useMasterKey: true });

    return trading;
}

async function saveTransaction(author, receiver, credits, tradingOrDiamonds, transactionTypes, type) {

    const Transactions = Parse.Object.extend("Transactions");
    const transaction = new Transactions();
  
    transaction.set("author", author);
    transaction.set("authorId", author.id);
    transaction.set("authorCredits", author.get("credit"));
    transaction.set("authorDiamonds", author.get("diamonds") || 0);
    transaction.set("authorCreditsTrade", author.get("creditsTrade") || 0);
  
    transaction.set("receiver", receiver);
    transaction.set("receiverId", receiver.id);
    transaction.set("receiverCredits", receiver.get("credit"));
    transaction.set("receiverDiamonds", receiver.get("diamonds") || 0);
    transaction.set("receiverCreditsTrade", receiver.get("creditsTrade") || 0);
  
    transaction.set("status", "completed");
    transaction.set("type", type);

    transaction.set("credits", credits);

    if(transactionTypes.trading){
        transaction.set("trading", tradingOrDiamonds);
    }

    if(transactionTypes.exchange){
        transaction.set("diamonds", tradingOrDiamonds);
    }
    
  
    await transaction.save(null, { useMasterKey: true });
  
    return transaction;
  }