export async function getMe(req, res) {
  res.json({
    userId: req.user.userId,
    identifier: req.user.identifier
  });
}
