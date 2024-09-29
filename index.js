const express = require('express');
const axios = require('axios');

const app = express();
const PORT = 3000;

// Middleware para tratar JSON
app.use(express.json());

// Rota POST para criar o pagamento
app.post('/pagamento', async (req, res) => {
    const { valor, token } = req.body; // Captura o valor e o token

    // Validação do valor
    if (typeof valor !== 'number' || valor <= 0) {
        return res.status(400).json({ message: 'O valor deve ser um número positivo.' });
    }

    // Validação do token
    if (!token) {
        return res.status(400).json({ message: 'Token não fornecido.' });
    }

    try {
        const response = await axios.post('https://api.mercadopago.com/v1/payments', {
            transaction_amount: valor,
            description: 'Pagamento via PIX',
            payment_method_id: 'pix',
            payer: {
                email: 'payer_email@gmail.com', // Substitua pelo e-mail do pagador
            },
        }, {
            headers: {
                Authorization: `Bearer ${token}`, // Usa o token fornecido no body
            },
        });

        const pagamento = response.data;
        const paymentLink = pagamento.point_of_interaction.transaction_data.qr_code;
        const id_gerado = pagamento.id;

        // Verifica se o código de pagamento foi gerado
        if (!paymentLink) {
            console.log('Código de pagamento vazio');
            return res.status(400).json({ message: 'Código de pagamento não gerado' });
        } else {
            return res.status(200).json({ paymentLink, id_gerado }); // Retorna o código de pagamento
        }
    } catch (error) {
        console.error('Erro ao criar pagamento:', error.response ? error.response.data : error.message);
        return res.status(500).json({ message: 'Erro ao criar pagamento', error: error.response ? error.response.data : error.message });
    }
});

// Rota GET para verificar o status do pagamento
app.get('/verificar/:id', async (req, res) => {
    const pagamentoId = req.params.id; // Captura o ID do pagamento da URL
    const authHeader = req.headers['authorization']; // Captura o token do cabeçalho

    // Validação do token
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(400).json({ message: 'Token não fornecido ou mal formatado.' });
    }

    const token = authHeader.split(' ')[1]; // Remove o 'Bearer' e captura apenas o token

    try {
        const response = await axios.get(`https://api.mercadopago.com/v1/payments/${pagamentoId}`, {
            headers: {
                Authorization: `Bearer ${token}`, // Usa o token fornecido no cabeçalho
            },
        });

        const pagamento = response.data;
        const status = pagamento.status;

        // Retorna o status do pagamento
        return res.status(200).json({ status });
    } catch (error) {
        console.error('Erro ao verificar pagamento:', error.response ? error.response.data : error.message);
        return res.status(500).json({ message: 'Erro ao verificar pagamento', error: error.response ? error.response.data : error.message });
    }
});

// Iniciar a aplicação
app.listen(PORT, () => {
    console.log(`Servidor rodando em ${PORT}`);
});