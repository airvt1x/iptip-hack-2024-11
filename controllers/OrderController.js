import OrderModel from "../models/Order.js"
import StageModel from "../models/Stage.js"
import UserModel from "../models/User.js"
import dotenv from 'dotenv'
import { Resend } from 'resend';
import {gpt} from '../utils/index.js'


dotenv.config()
const resend = new Resend(process.env.RESENDAPIKEY);

export const podborka = async (req, res) => {
    try {
        const orderId = req.params.id
        const text = await OrderModel.findById(orderId)
        const token = await gpt.getIamToken(process.env.YA_OAUTH_TOKEN)
        const response = await gpt.getTextCompletion(token.iamToken, text.content);
        res.status(200).json(response.result.alternatives[0].message.text);
        await OrderModel.updateOne({_id: orderId}, {risks: response.result.alternatives[0].message.text});
    } catch (err) {
        res.status(500).json({
            message: 'Что-то пошло не так',
        });
        console.log(err);
    }
  }
  
export const createstage = async (req,res) => {
    try {
        const OrderId = req.params.id;
        const user_organization = await UserModel.findById(req.userId)
        const stage = {
            title: req.body.title,
            content: req.body.content,
            date: req.body.dateStart,
            dateEnd: req.body.dateEnd,
            price: req.body.price,
            organization: user_organization.organization
        }
        const newStage = new StageModel(stage);
        const savedStage = await newStage.save();
        const existingOrder = await OrderModel.findById(OrderId);
        if (!existingOrder) {
           const existingStage = await StageModel.findById(savedStage._id);
            if (!existingStage) {
                return res.status(404).json({
                    message: 'Ордер или стадия не найдены'
                });
            }
            else {
                const stage = await StageModel.findOneAndUpdate({_id:OrderId}, { $push: { stages: savedStage._id } },{returnDocument: 'after'})
                .populate('stages')
                res.json(stage);
            };
        }
        else {
            const order = await OrderModel.findOneAndUpdate( {_id: OrderId}, { $push: { stages: savedStage._id } },{returnDocument: 'after'})
            .populate('stages')
            .populate({
                path: 'manager', 
                select: '-passwordHash' 
            });
            res.json(order);
        }
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
        await resend.emails.send({
            from: 'Fluxo notifier<onboarding@resend.dev>',
            to: "airat3552@gmail.com",
            subject: "Новый ордер",
            html: `<h1>Здравствуйте!</h1>
    <p>Был создан новый ордер: <strong>«${savedOrder.title}»</strong>.</p>
    <p>Все подробности Вы найдете в системе.</p>
    <div class="signature">Спасибо за Ваше внимание и сотрудничество!<br><em>Команда FLUXO</em></div>`,
        });
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

async function populateStages(stage) {
    if (!stage.stages || stage.stages.length === 0) return stage;
    
    // Пополняем текущий уровень стадий
    await StageModel.populate(stage, {
        path: 'stages',
        model: 'Stage',
        options: { lean: true }, 
        populate: {
            path: 'stages',
            model: 'Stage',
            options: { lean: true },
            populate: {
                path: 'stages',
                model: 'Stage',
                options: { lean: true }
            }
        }
    });

   
    for (let i = 0; i < stage.stages.length; i++) {
        await populateStages(stage.stages[i]);
    }

    return stage;
}


export const getById = async (req, res) => {
    try {
        const OrderId = req.params.id;
        
        
        const order = await OrderModel.findOne({ _id: OrderId })
            .populate({
                path: 'manager',
                select: '-passwordHash'
            });


        await populateStages(order);

        res.json(order);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Не удалось подгрузить ордер' });
    }
};

export const remove = async (req, res) => {
    try {
        const StageId = req.params.id;
        const stage = await StageModel.findById(StageId);
        if (!stage) {
            return res.status(404).json({ message: 'Стадия не найдена' });
        }

        await StageModel.deleteMany({ _id: { $in: stage.stages } });
        await StageModel.findByIdAndDelete(StageId);

        res.json({ message: 'Cвязанные стадии удалены' });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            message: 'Не удалось удалить cтадию'
        });
    }
}


export const update = async (req, res) => {
    try {
        const OrderId = req.params.id;
        const updatedOrder = await OrderModel.findOneAndUpdate(
            { _id: OrderId },
            {
                title: req.body.title,
                content: req.body.content,
                dateEnd: req.body.dateEnd,
                price: req.body.price,
                status: req.body.status,
                organization: req.body.organization,
                stages: req.body.stages,
                risks: req.body.risks,
                manager: req.body.manager,
            },
            { returnDocument: 'after' } 
        )
        .populate('stages')
        .populate({
            path: 'manager',
            select: '-passwordHash'
        });

        if (!updatedOrder) {
            return res.status(404).json({
                message: 'Ордер не найден'
            });
        }

        res.json(updatedOrder);

    } catch (err) {
        console.log(err);
        res.status(500).json({
            message: 'Не удалось изменить ордер',
            error: err
        });
    }
}

