// Define the Parse Cloud Function for manual trigger
Parse.Cloud.define("updateUserPostsManual", async (request) => {
    const Posts = Parse.Object.extend("Posts");
    const query = new Parse.Query(Posts);
    
    // Get all posts
    const results = await query.find({ useMasterKey: true });
  
    // Process each post
    for (let i = 0; i < results.length; i++) {
      const post = results[i];
      const type = post.get("type");
      const author = post.get("Author");
      const postId = post.id;
  
      if (author) {
        const userQuery = new Parse.Query(Parse.User);
        try {
          const user = await userQuery.get(author.id, { useMasterKey: true });
  
          if (type === "video") {
            user.addUnique("post_ids_list", postId);
            user.addUnique("post_video_list", postId);
          } else if (type === "image") {
            user.addUnique("post_ids_list", postId);
            user.addUnique("post_photo_list", postId);
          }
  
          await user.save(null, { useMasterKey: true });
        } catch (error) {
          console.error("Error updating user: ", error);
        }
      }
    }
  
    return "User posts updated successfully.";
  });