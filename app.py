import os

from flask import Flask, render_template


app = Flask(__name__)


@app.get("/")
def index():
    config = {
        "gestaoApiUrl": os.environ.get(
            "GESTAO_API_BASE_URL",
            "https://api-de-gerenciamento-escolar.onrender.com",
        ).rstrip("/"),
        "reservaApiUrl": os.environ.get(
            "RESERVA_API_BASE_URL",
            "https://api-de-reserva-de-salas.onrender.com",
        ).rstrip("/"),
        "atividadeApiUrl": os.environ.get(
            "ATIVIDADE_API_BASE_URL",
            "https://atividade-microservice-api-escolar.onrender.com",
        ).rstrip("/"),
    }
    return render_template("index.html", config=config)


@app.get("/health")
def health():
    return {"status": "ok"}


if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=int(os.environ.get("PORT", 5003)),
        debug=os.environ.get("FLASK_DEBUG", "false").lower() == "true",
    )
