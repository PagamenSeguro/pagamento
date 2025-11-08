import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// 🔑 Variáveis principais
const ASAAS_URL = "https://api.asaas.com/v3";
const ASAAS_KEY = process.env.ASAAS_API_KEY;

// 🧾 Criar pagamento PIX
app.post("/api/pix/create", async (req, res) => {
  try {
    const response = await fetch(`${ASAAS_URL}/payments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "PixAppV1",
        "access_token": ASAAS_KEY
      },
      body: JSON.stringify({
        customer: "cus_000144934536",
        billingType: "PIX",
        value: 89.9,
        description: "Entrada - Smartphone Redmi Note 14 256GB",
        dueDate: new Date(Date.now() + 10 * 60000).toISOString().split("T")[0]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Erro API:", data);
      return res.status(400).json(data);
    }

    // 🔄 Gerar QRCode PIX
    const pix = await fetch(`${ASAAS_URL}/payments/${data.id}/pixQrCode`, {
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "PixAppV1",
        "access_token": ASAAS_KEY
      }
    });

    const qr = await pix.json();

    res.json({
      id: data.id,
      payload: qr.payload,
      encodedImage: qr.encodedImage
    });
  } catch (err) {
    console.error("Erro interno:", err);
    res.status(500).json({ error: "Erro interno ao criar pagamento PIX" });
  }
});

// 📊 Consultar status do pagamento
app.get("/api/pix/status/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const r = await fetch(`${ASAAS_URL}/payments/${id}`, {
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "PixAppV1",
        "access_token": ASAAS_KEY
      }
    });
    const d = await r.json();
    res.json({ status: d.status || "UNKNOWN" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Erro ao verificar status" });
  }
});

// ❌ Cancelar pagamento (caso expire)
app.post("/api/pix/cancel/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const r = await fetch(`${ASAAS_URL}/payments/${id}/cancel`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "PixAppV1",
        "access_token": ASAAS_KEY
      }
    });
    const d = await r.json();
    res.json(d);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Erro ao cancelar pagamento" });
  }
});

// 🌐 Rota raiz (teste rápido)
app.get("/", (req, res) => {
  res.send("✅ API Pix funcionando!");
});

// 🚀 Porta dinâmica (Render usa process.env.PORT)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor online na porta ${PORT}`));
