FROM docker.io/rust:1.71.1 as build
# Install and configure NODE using NVM
RUN mkdir /usr/local/nvm
ENV NVM_DIR /usr/local/nvm
ENV NODE_VERSION 18.17.1
RUN curl https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash \
    && . $NVM_DIR/nvm.sh \
    && nvm install $NODE_VERSION \
    && nvm alias default $NODE_VERSION \
    && nvm use default

ENV NODE_PATH $NVM_DIR/v$NODE_VERSION/lib/node_modules
ENV PATH $NVM_DIR/versions/node/v$NODE_VERSION/bin:$PATH

RUN npm install -g pnpm
RUN mkdir /build
WORKDIR /build
COPY . .
RUN cd makoon/src-web; \
    pnpm install; \
    pnpm build;
RUN cargo build --release

FROM debian:bullseye-slim
RUN mkdir /app
WORKDIR /app
COPY --from=build /build/target/release/makoon .
ENV RUST_LOG="info"
ENV MAKOON_DB_PATH="/app/data/makoon.db"
ENV MAKOON_SERVER_PORT=8080
VOLUME /app/data
CMD ["/app/makoon"]