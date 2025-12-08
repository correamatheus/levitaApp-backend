import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
    res.status(200).send('Get all users');
})

router.get('/:id', (req, res) => {
    res.status(200).send(`Get user with ID ${req.params.id}`);
})

router.post('/:id', (req, res) => {
    res.json({ message: `Create user with ID ${req.params.id}` });
})

router.put('/:id', (req, res) => {
    res.json({ message: `Update user with ID ${req.params.id}` });
})

router.delete('/:id', (req, res) => {
    res.json({ message: `Delete user with ID ${req.params.id}` });
})

export default router;