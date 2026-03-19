FROM atendai/evolution-api:latest

# Render expects the app to listen on $PORT (usually 10000).
# Evolution API uses SERVER_PORT (default 8080), so we pin it to 10000.
ENV SERVER_PORT=10000

EXPOSE 10000

