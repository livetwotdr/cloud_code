const rewards = {
  "1hour": 10000,
  "5hours": 10000,
  "8hours": 10000,
  "12hours": 30000,
  "20dollars": 10000,
  "50dollars": 20000,
  "100dollars": 20000,
  "200dollars": 30000
};

async function checkInviterRewards(stream) {
  const author = stream.get("author");
  const inviterId = author.get("invitedByUser");

  if (!inviterId) return; // No inviter, exit function

  const inviteeCreatedAt = author.get("createdAt");
  const now = new Date();
  const daysSinceInvitation = (now - inviteeCreatedAt) / (1000 * 60 * 60 * 24);

  const InviterRewards = Parse.Object.extend("InviterRewards");
  const query = new Parse.Query(InviterRewards);
  query.equalTo("inviterId", inviterId);
  query.equalTo("inviteeId", author.id);
  let inviterReward = await query.first({ useMasterKey: true });

  if (!inviterReward) {
    inviterReward = new InviterRewards();
    inviterReward.set("inviterId", inviterId);
    inviterReward.set("inviteeId", author.id);
    inviterReward.set("totalBroadcastHours", 0);
    inviterReward.set("totalEarnings", 0);
    inviterReward.set("claimedRewards", []);
  }

  // Update total broadcast hours (max 3 hours per day)
  const dailyHours = Math.min(stream.get("Duration") / 3600, 3);
  inviterReward.increment("totalBroadcastHours", dailyHours);

  // Update total earnings
  const streamEarnings = stream.get("diamonds") || 0;
  inviterReward.increment("totalEarnings", streamEarnings);

  // Check and set rewards
  const totalHours = inviterReward.get("totalBroadcastHours");
  const totalEarnings = inviterReward.get("totalEarnings");
  const claimedRewards = inviterReward.get("claimedRewards");

  const rewardConditions = [
    { id: "1hour", condition: totalHours >= 1 && daysSinceInvitation <= 7 },
    { id: "5hours", condition: totalHours >= 5 && daysSinceInvitation <= 7 },
    { id: "8hours", condition: totalHours >= 8 && daysSinceInvitation <= 7 },
    { id: "12hours", condition: totalHours >= 12 && daysSinceInvitation <= 7 },
    { id: "20dollars", condition: totalEarnings >= 400000 && daysSinceInvitation <= 30 },
    { id: "50dollars", condition: totalEarnings >= 1000000 && daysSinceInvitation <= 30 },
    { id: "100dollars", condition: totalEarnings >= 2000000 && daysSinceInvitation <= 30 },
    { id: "200dollars", condition: totalEarnings >= 4000000 && daysSinceInvitation <= 30 },
  ];

  rewardConditions.forEach(reward => {
    if (reward.condition && !claimedRewards.includes(reward.id)) {
      inviterReward.addUnique("availableRewards", reward.id);
    }
  });

  let totalAvailableReward = 0;
  inviterReward.get("availableRewards").forEach(rewardId => {
    totalAvailableReward += rewards[rewardId];
  });
  inviterReward.set("totalAvailableReward", totalAvailableReward);

  await inviterReward.save(null, { useMasterKey: true });
}

Parse.Cloud.define("claimAllInviterRewards", async (request) => {
  const { authorId } = request.params;

  const query = new Parse.Query("InviterRewards");
  query.equalTo("inviterId", authorId);
  const inviterRewards = await query.find({ useMasterKey: true });

  if (inviterRewards.length === 0) {
    return { success: true, diamondsAwarded: 0 };
  }

  let totalDiamondsToAward = 0;

  for (const inviterReward of inviterRewards) {
    const availableRewards = inviterReward.get("availableRewards");
    const claimedRewards = inviterReward.get("claimedRewards") || [];

    availableRewards.forEach(rewardId => {
      const diamondsForReward = rewards[rewardId];
      totalDiamondsToAward += diamondsForReward;
      claimedRewards.push(rewardId);
    });

    inviterReward.set("availableRewards", []);
    inviterReward.set("claimedRewards", claimedRewards);
    inviterReward.set("totalAvailableReward", 0);
  }

  await inviterRewards.save(null, {useMasterKey: true});

  await updateRewardedUser(authorId, totalDiamondsToAward);

  return inviterRewards;
});

async function updateRewardedUser(authorId, diamonds) {
  
    const params = {
      type: "reward_inviter",
      credits: 0,
      diamonds: diamonds,
      receiverId: authorId,
      senderId: authorId,
    };
  
    try {
      await Parse.Cloud.run("send_credits", params);
    } catch (error) {
      console.error("Failed to pay commission:", error);
    }
  }

Parse.Cloud.define("totalAvailableRewards", async (request) => {
  const { authorId } = request.params;

  const query = new Parse.Query("InviterRewards");
  query.equalTo("inviterId", authorId);
  const inviterRewards = await query.find({ useMasterKey: true });

  let totalAvailableReward = 0;
  inviterRewards.forEach(reward => {
    totalAvailableReward += reward.get("totalAvailableReward") || 0;
  });

  return totalAvailableReward;
});

module.exports = {
  checkInviterRewards
};
