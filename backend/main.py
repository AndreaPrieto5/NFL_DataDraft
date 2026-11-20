"""API de la plantilla. Ejecuta: .venv/Scripts/uvicorn backend.main:app --reload"""
import os
from pathlib import Path


def cargar_env():
    f = Path(__file__).resolve().parent.parent / ".env"
    if f.exists():
        for linea in f.read_text(encoding="utf-8-sig").splitlines():
            linea = linea.strip()
            if linea and not linea.startswith("#") and "=" in linea:
                k, v = linea.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))


cargar_env()

from fastapi import FastAPI, HTTPException  # noqa: E402
from pydantic import BaseModel, Field  # noqa: E402
from strands import Agent  # noqa: E402
from strands.models import BedrockModel  # noqa: E402

MODEL_ID = os.environ.get("BEDROCK_MODEL_ID", "us.amazon.nova-pro-v1:0")
REGION = os.environ.get("AWS_REGION", "us-east-1")

SISTEMA = (
    "Eres un analista de la NFL que ayuda a un equipo del hackathon NFL Big Data Bowl "
    "de la UNAM. Responde en español, de forma clara y breve."
)

app = FastAPI(title="Hackathon NFL UNAM")


def nuevo_agente() -> Agent:
    # Un agente por petición para no mezclar conversaciones entre usuarios.
    modelo = BedrockModel(
        model_id=MODEL_ID, region_name=REGION, temperature=0.3, max_tokens=800
    )
    return Agent(model=modelo, system_prompt=SISTEMA, callback_handler=None)


class Pregunta(BaseModel):
    pregunta: str = Field(min_length=1, max_length=4000)


class Respuesta(BaseModel):
    respuesta: str
    modelo: str


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.post("/api/ia/preguntar", response_model=Respuesta)
def preguntar(datos: Pregunta) -> Respuesta:
    """Envía una pregunta a Amazon Nova (Bedrock) y devuelve su respuesta."""
    try:
        resultado = nuevo_agente()(datos.pregunta)
        texto = str(resultado).strip()
    except Exception as e:  # la app debe seguir funcionando aunque la IA falle
        raise HTTPException(
            status_code=503, detail=f"La IA no está disponible: {type(e).__name__}"
        )
    return Respuesta(respuesta=texto, modelo=MODEL_ID)