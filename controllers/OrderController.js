import OrderModel from "../models/Order.js"
import UserModel from "../models/User.js"
import StageModel from "../models/Stage.js"
import dotenv from 'dotenv'
import { Resend } from 'resend';


dotenv.config()
const resend = new Resend(process.env.RESENDAPIKEY);


export const createstage = async (req,res) => {
    try {
        const OrderId = req.params.id;
        const stage = {
            title: req.body.title,
            content: req.body.content,
            date: req.body.dateStart,
            dateEnd: req.body.dateEnd,
            price: req.body.price,
        }
        const newStage = new StageModel(stage);
        const savedStage = await newStage.save();
        const order = await OrderModel.findOneAndUpdate( {_id: OrderId}, { $push: { stages: savedStage._id } },);
        res.json(order);
    } catch (err) {
        console.log(err);
        res.status(500).json({
            message: 'Не удалось подгрузить ордеры'
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
                    from: 'Fluxo notifier<onboarding@resend.dev>',
                    to: "airat3552@gmail.com",
                    subject: "Новый ордер",
                    html: `<h1>Здравствуйте!</h1>
            <p>Был создан новый ордер: <strong>«${savedOrder.title}»</strong>.</p>
            <p>Все подробности Вы найдете в системе.</p>
            <div class="signature">Спасибо за Ваше внимание и сотрудничество!<br><em>Команда FLUXO</em></div>`,
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

export const getAll = async(req,res)=>{
    try {
        const Orders = await OrderModel
        .find()
        res.json(Orders);
    } catch (err) {
        console.log(err);
        res.status(500).json({
            message: 'Не удалось подгрузить ордеры'
        })
    }
}

export const getById = async(req,res)=>{
    try {
        const OrderId = req.params.id;
        OrderModel.findOne({
            _id: OrderId
        }.populate('stages')
        .populate({
            path: 'manager', 
            select: '-passwordHash' 
        }).then(Order => {res.json(Order)}));
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