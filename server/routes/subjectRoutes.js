const router = require("express").Router();
const ctrl = require("../controllers/subjectController");
const auth = require("../middleware/auth");
const roles = require("../middleware/roles");

router.post("/", auth, roles("Admin", "Faculty"), ctrl.createSubject);
router.get("/", auth, roles("Admin", "Faculty", "Student"), ctrl.getSubjects);
router.put("/:id", auth, roles("Admin", "Faculty"), ctrl.updateSubject);
router.delete("/:id", auth, roles("Admin", "Faculty"), ctrl.deleteSubject);

module.exports = router;
