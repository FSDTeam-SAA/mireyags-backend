import express from 'express';
import authRoutes from '../../entities/auth/auth.routes.js';
import userRoutes from '../../entities/user/user.routes.js';
import contactRoutes from '../../entities/contact/contact.routes.js';
import brandRoutes from '../../entities/brands/brands.routes.js';
import categoryRoutes from '../../entities/category/category.routes.js';
import productRoutes from '../../entities/product/product.routes.js';
import orderRoutes from '../../entities/order/order.routes.js';
import reviewRoutes from '../../entities/review/review.routes.js';
import dashboardRoutes from '../../entities/dashboard/dashboard.routes.js';



const router = express.Router();


router.use('/v1/auth', authRoutes);
router.use('/v1/user', userRoutes);
router.use('/v1/contact', contactRoutes);

router.use('/v1/brands', brandRoutes);
router.use('/v1/category', categoryRoutes);
router.use('/v1/product', productRoutes);
router.use('/v1/order', orderRoutes);
router.use('/v1/review', reviewRoutes);
router.use('/v1/dashboard', dashboardRoutes);


export default router;
