require("dotenv").config()
const amqplib = require('amqplib');
const constant = require("./constant");

(async () => {
    const deadLetterExchange = constant.TASK_EXCHANGE_DLX
    const deadLetterQueue = constant.TASK_QUEUE_DLQ
    const deadLetterRoutingKey = constant.TASK_ROUTING_KEY_DLQ

    const exchange = constant.TASK_EXCHANGE;
    const queue = constant.TASK_QUEUE;
    const conn = await amqplib.connect(process.env.RABBIT_URL);

    const ch1 = await conn.createChannel();
    await ch1.assertExchange(deadLetterExchange, "direct")
    await ch1.assertQueue(deadLetterQueue)
    await ch1.bindQueue(deadLetterQueue, deadLetterExchange, deadLetterRoutingKey)

    await ch1.assertExchange(exchange, "direct")
    await ch1.assertQueue(queue, { 
        deadLetterExchange: deadLetterExchange,
        deadLetterRoutingKey: deadLetterRoutingKey
    });

    await ch1.bindQueue(queue, exchange, "")

    ch1.consume(queue, (msg) => {
        try {
            console.log(JSON.parse(msg.content.toString()))
            ch1.ack(msg)
        } catch(error) {
            ch1.nack(msg, false, false)
        }
    });

})();