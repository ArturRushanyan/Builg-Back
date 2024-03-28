module.exports = (plugin) => {
  plugin.controllers.user.updateMe = async (ctx) => {
    if (!ctx.state.user) {
      return { status: 401, message: "Unauthorized request" };
    }
    const user = ctx.state.user;
    const reqBody = ctx.request.body;

    const newDataForUser = {
      email: reqBody.email,
      first_name: reqBody.first_name,
      last_name: reqBody.last_name,
      sync_google_reviews: reqBody.sync_google_reviews,
    };

    if (reqBody.sync_google_reviews) {
      if (!reqBody.company_address && !reqBody.company_name) {
        ctx.response.status = 422;
        ctx.response.message =
          "Company Name and Address is required in 'Sync google reviews' mode";
        return ctx;
      }
      newDataForUser.company_address = reqBody.company_address;
      newDataForUser.company_name = reqBody.company_name;
      newDataForUser.sync_google_reviews_updated_at = new Date();
    }

    try {
      const updatedUser = await strapi
        .query("plugin::users-permissions.user")
        .update({
          where: { id: user.id },
          data: newDataForUser,
        });
      return { status: 200, user: updatedUser };
    } catch (error) {
      return { status: 500, message: "Internal server error" };
    }
  };

  plugin.controllers.user.getSyncUsers = async (ctx) => {
    console.log("ctx.request =>>>", ctx.query);
    const offset = ctx.query.offset || 0;
    const limit = ctx.query.limit || 10;
    if (!ctx.state.user) {
      return { status: 401, message: "Unauthorized request" };
    }

    try {
      const syncUsers = await strapi
        .query("plugin::users-permissions.user")
        .findMany({
          where: { sync_google_reviews: true },
          orderBy: { sync_google_reviews_updated_at: "desc" },
          offset,
          limit,
        });

      console.log("syncUsers =>>>", syncUsers);
      return { status: 200, syncUsers };
    } catch (error) {
      return { status: 500, message: "Internal server error" };
    }
  };

  plugin.routes["content-api"].routes.push({
    method: "PUT",
    path: "/user/me",
    handler: "user.updateMe",
    config: {
      prefix: "",
      policies: [],
    },
  });

  plugin.routes["content-api"].routes.push({
    method: "GET",
    path: "/user/sync-users",
    handler: "user.getSyncUsers",
    config: {
      prefix: "",
      policies: [],
    },
  });

  return plugin;
};
