FROM python:3.11-slim

WORKDIR /app

COPY requirements-simple.txt .
RUN pip install --no-cache-dir -r requirements-simple.txt

COPY virtual_try_on_service.py .

EXPOSE 8000
CMD ["python", "virtual_try_on_service.py"]
