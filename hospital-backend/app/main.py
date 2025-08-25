from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import socketio

from app.api.endpoints import login, users, patients, appointments, prescriptions, hospitals
from app.socket_manager import sio

app = FastAPI(title="Hospital Management API")

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict this to your frontend domain
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Socket.IO app
sio_app = socketio.ASGIApp(sio)
app.mount("/ws", sio_app)

# Include API routers
app.include_router(login.router, tags=["Login"], prefix="/api")
app.include_router(users.router, tags=["Users (Admin)"], prefix="/api/users")
app.include_router(patients.router, tags=["Patients"], prefix="/api/patients")
app.include_router(appointments.router, tags=["Appointments"], prefix="/api/appointments")
app.include_router(prescriptions.router, tags=["Prescriptions"], prefix="/api/prescriptions")
app.include_router(hospitals.router, tags=["Hospitals (Admin)"], prefix="/api/hospitals") # <-- ADD THIS LINE


@app.get("/")
def read_root():
    return {"message": "Welcome to the Hospital Management System API"}