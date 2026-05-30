# Backward compatibility alias — imports Prescription as Remedy
from app.models.prescription import Prescription as Remedy, PrescriptionBase as RemedyBase, PrescriptionCreate, PrescriptionSearchRequest

RemedySearchRequest = PrescriptionSearchRequest
