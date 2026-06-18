const { getUserFromToken } = require("../logic/user");

function _makeRequireAuth(getUserFn) {
    return async function requireAuth(req, res, next) {
        const loginToken = req.cookies[process.env.BTW_UUID_KEY || "btw_uuid"];
        const user = await getUserFn({ token: loginToken });
        if (!user) return res.status(401).json({ success: false, error: "Unauthorized" });
        req.user = user;
        next();
    };
}

const requireAuth = _makeRequireAuth(getUserFromToken);

async function requirePlatformAdmin(req, res, next) {
    const adminEmails = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim()).filter(Boolean);
    if (adminEmails.length === 0) {
        return res.status(403).json({ success: false, error: "Forbidden" });
    }
    if (!req.user || !adminEmails.includes(req.user.email)) {
        return res.status(403).json({ success: false, error: "Forbidden" });
    }
    next();
}

module.exports = { requireAuth, requirePlatformAdmin, _makeRequireAuth };
