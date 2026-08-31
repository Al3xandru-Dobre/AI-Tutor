const { getServices } = require('../middlewear/initialise');

async function orchestratorStatus(req, res) {
    const { orchestrator } = getServices();
    res.json(orchestrator.getStatus());
}

async function orchestrateSearch(req, res) {
    try {
        const { orchestrator } = getServices();
        const { query, level = 'beginner', context = {} } = req.body;
        const result = await orchestrator.getAugmentedAnswer(query, level, context);

        res.json(result);
    } catch (error) {
        console.error('Orchestrator search error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}

module.exports = {
    orchestratorStatus,
    orchestrateSearch
};