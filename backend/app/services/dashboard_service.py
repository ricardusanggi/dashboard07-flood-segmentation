#backend/app/services/dashboard_service.py
def get_total_users(db: Session):
    return db.query(models_database.User).count()

def get_total_models(db: Session):
    return db.query(models_database.Model).count()

def get_total_trainings(db: Session):
    return db.query(models_database.TrainingJob).count()