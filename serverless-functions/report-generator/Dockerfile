FROM openfaas/of-watchdog:0.9.14 as watchdog

FROM python:3.11-alpine

COPY --from=watchdog /fwatchdog /usr/bin/fwatchdog
RUN chmod +x /usr/bin/fwatchdog

RUN mkdir -p /home/app

WORKDIR /home/app

COPY handler.py ./

ENV fprocess="python handler.py"
ENV mode="http"

EXPOSE 8080

HEALTHCHECK --interval=3s --timeout=1s --start-period=2s --retries=3 \
  CMD [ -e /tmp/.lock ] || exit 1

CMD ["fwatchdog"]
