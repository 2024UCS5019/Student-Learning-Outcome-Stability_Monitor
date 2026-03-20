const router = require("express").Router();
const ctrl = require("../controllers/noteHistoryController");
const auth = require("../middleware/auth");
const roles = require("../middleware/roles");

router.get("/", auth, roles("Admin", "Faculty", "Student"), ctrl.getNotes);
router.get("/targets", auth, roles("Admin", "Faculty"), ctrl.getTargets);
router.post("/", auth, roles("Admin", "Faculty"), ctrl.createNote);
router.put("/:id", auth, roles("Admin", "Faculty"), ctrl.updateNote);
router.delete("/:id", auth, roles("Admin", "Faculty"), ctrl.deleteNote);

module.exports = router;
