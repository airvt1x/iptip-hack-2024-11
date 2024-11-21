import OrderModel from "../models/Order.js"
import UserModel from "../models/User.js"
import dotenv from 'dotenv'
import { Resend } from 'resend';


dotenv.config()
const resend = new Resend(process.env.RESENDAPIKEY);


export const getAll = async(req,res)=>{
    try {
        const Orders = await OrderModel.findAll();
    } catch (err) {
        console.log(err);
        res.stasts(500).json({
            message: 'Не удалось подгрузить ордеры'
        })
    }
}

export const getById = async(req,res)=>{
    try {
        const OrderId = req.params.id;
        OrderModel.findOne({
            _id: OrderId
        }).then(Order => {res.json(Order)});
    } catch (err) {
        console.log(err);
        res.stasts(500).json({
            message: 'Не удалось подгрузить ордер'
        })
    }
}

export const remove = async(req,res)=>{
    try {
        const OrderId = req.params.id;
        await OrderModel.findByIdAndDelete(OrderId);
        res.json({ message: 'Ордер удален' });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            message: 'Не удалось удалить ордер'
        })
    }
}


export const create = async (req, res) => {
    try {
        const orderData = {
            title: req.body.title,
            content: req.body.content,
            dateEnd: req.body.dateEnd,
            price: req.body.price,
        };
        
        const newOrder = new OrderModel(orderData);
        const savedOrder = await newOrder.save();
        const managers = await UserModel.find({ role: 'manager' });

        if (managers.length > 0) {
            const emails = managers.map((manager) => manager.email);
            try {
                await resend.emails.send({
                    from: 'Бот 1с хакатона <onboarding@resend.dev>',
                    to: "airat3552@gmail.com",
                    subject: "Новый ордер",
                    html: `Новый ордер <strong>"${savedOrder.title}"</strong> создан.`,
                });
    
            } catch (error) {
                console.error(`Ошибка отправки писем менеджерам:`, error);
            }
        }
    

        res.json(savedOrder);
    } catch (err) {
        console.log(err);
        res.status(500).json({
            message: 'Не удалось создать ордер'
        })
    }
}

export const update = async (req, res) => {
    try {
        const OrderId = req.params.id;
        await OrderModel.updateOne({
            _id: OrderId,
        },
    {
        title: req.body.title,
        content: req.body.content,
        dateEnd: req.body.dateEnd,
        price: req.body.price,
        status: req.body.status,
        organization: req.body.organization,
        stages: req.body.stages,
        risks: req.body.risks,
    });
    OrderModel.findOne({
        _id: OrderId
    }).then(Order => {res.json(Order)});
    } catch (err) {
        res.status(500).json({
            message: 'Не удалось изменить ордер'
        })
    }
}