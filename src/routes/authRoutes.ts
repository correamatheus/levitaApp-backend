import { Router} from 'express';

const router = Router();

router.post('/register', (req, res) => {
    res.status(201).send('User registered');
})

router.post('/login', (req, res) => {
    res.status(200).send('User logged in');
})

export default router;