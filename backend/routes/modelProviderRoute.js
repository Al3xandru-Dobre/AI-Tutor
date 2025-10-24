const express = require ('express');
const router = express.Router();
const { ensureServicesInitialized, getServices } = require('../middlewear/initialise');

router.use(ensureServicesInitialized);

router.get('/providers', (req,res) => {
    try {
        const { modelProvider } = getServices();
        if (!modelProvider || !modelProvider.isInitialized) {
            return res.json({
                current: 'ollama',
                available: ['ollama'],
                providers: {
                    ollama: { available: true, type: 'local', speed: 'medium', cost: 'free', models: [] }
                }
            });
        }
        res.json(modelProvider.getAvailableProviders());
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
})

router.post('/switch', (req,res) => {
    const { provider } = req.body;

    try{
        const { modelProvider } = getServices();
        if (!modelProvider || !modelProvider.isInitialized) {
            return res.status(503).json({ error: 'Model provider service not available' });
        }

        modelProvider.setProvider(provider);
        res.json({
            success: true,
            currentProvider: provider,
            message:`Switched to ${provider}`
        })
    } catch(error){
        res.status(400).json({error: error.message});
    }
})

router.get('/stats', (req, res) => {
    try {
        const { modelProvider } = getServices();
        if (!modelProvider || !modelProvider.isInitialized) {
            return res.json({ error: 'Model provider service not available' });
        }
        res.json(modelProvider.getStats());
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
})

router.get('/list', async (req, res) => {
    try {
        const { provider } = req.query;
        const { modelProvider } = getServices();

        if (!provider) {
            return res.status(400).json({ error: 'Provider parameter required' });
        }

        if (!modelProvider || !modelProvider.isInitialized) {
            return res.json({ provider, models: [] });
        }

        const models = await modelProvider.getAvailableModels(provider);
        res.json({ provider, models });
    } catch(error){
        res.status(500).json({error: error.message});
    }
})

module.exports = router;