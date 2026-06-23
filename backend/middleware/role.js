function allowRoles(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: "Not authorized" });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: `Role '${req.user.role}' cannot perform this action` });
    }
    next();
  };
}

module.exports = allowRoles;
