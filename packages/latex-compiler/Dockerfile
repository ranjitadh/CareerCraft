FROM debian:bookworm

RUN apt-get update && apt-get install -y --no-install-recommends \
    texlive-latex-base \
    texlive-latex-extra \
    texlive-fonts-recommended \
    texlive-fonts-extra \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /compile

COPY compile.sh /compile/compile.sh
RUN chmod +x /compile/compile.sh

CMD ["sleep", "infinity"]
