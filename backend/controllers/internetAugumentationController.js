
const { getServices } = require('../middlewear/initialise');

async function internetStatus(req, res) {
    const { internetService } = getServices();
    res.json(internetService.getStatus());
}

async function internetSearch(req, res) {
    try {
        const { rag } = getServices();
        const { query, maxResults = 3 } = req.body;

        const results = await rag.searchRelevantContent(query, 'beginner', maxResults);
        res.json({
            results,
            query,
            maxResults
        });
    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
}

module.exports = {
    internetStatus,
    internetSearch
};