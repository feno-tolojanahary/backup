const router = require("express").Router();
const notificationRuleController = require("../controllers/notificationRuleController");

router.route('/')
    .post(notificationRuleController.saveRules)
    .get(notificationRuleController.getRules);

router.route(':id')
    .put(notificationRuleController.updateRules)
    .delete(notificationRuleController.deleteRule);

module.exports = router;
