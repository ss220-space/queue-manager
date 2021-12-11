mod fwmanage;

use std::collections::{HashMap, HashSet};

use std::net::{Ipv4Addr, SocketAddrV4};
use log::LevelFilter;
use tokio_tungstenite::connect_async;
use tokio_tungstenite::tungstenite::http::Uri;
use serde::Serialize;
use serde::Deserialize;
use serde_json::Value;
use simplelog::{ColorChoice, Config, TerminalMode, TermLogger};
use tokio_tungstenite::tungstenite::{Message, Result};
use futures_util::StreamExt;
use crate::fwmanage::FwChain;

#[derive(Serialize, Deserialize, Debug, Clone)]
struct DConfig {
    master_uri: String,
    allow_ports: Vec<u16>,
    redirect_port: u16
}

#[derive(Deserialize, Debug)]
enum Action {
    ALLOW,
    REVOKE
}

#[derive(Deserialize, Debug)]
struct EventMessage {
    action: Action,
    inbound: SocketAddrV4
}

#[derive(Deserialize, Debug)]
struct InitialMessage {
    accepts: Vec<SocketAddrV4>
}


#[tokio::main]
async fn main() {

    TermLogger::init(LevelFilter::Debug, Config::default(), TerminalMode::Mixed, ColorChoice::Auto).unwrap();
    let mut config_s = config::Config::default();

    config_s.merge(config::File::with_name("config")).unwrap();

    let config: DConfig = config_s.try_into().unwrap();
    log::info!("Started with config: {:?}", config);

    process(config).await.unwrap();
}

struct FwState {
    chains: HashMap<u16, FwChain>
}

impl FwState {
    fn provide_chain(&mut self, config: &DConfig, port: u16) -> Option<&mut FwChain> {
        if !config.allow_ports.contains(&port) {
            return Option::None
        }
        Option::Some(self.chains.entry(port).or_insert_with(
            || {
                let mut chain = FwChain::new(
                    format!("SS_ENTRY_{}", port),
                    port,
                    config.redirect_port
                );
                chain.init().unwrap();
                chain
            }
        ))
    }
}

impl Default for FwState {
    fn default() -> Self {
        Self {
            chains: HashMap::new()
        }
    }
}

impl Drop for FwState {
    fn drop(&mut self) {
        for (_, chain) in &mut self.chains {
            chain.cleanup().unwrap()
        }
    }
}

async fn process(config: DConfig) -> Result<()> {
    let (mut stream, _) = connect_async(Uri::try_from(config.master_uri.as_str()).unwrap()).await.unwrap();

    let mut state: FwState = Default::default();

    while let Some(message) = stream.next().await {
        let message = message?;
        match message {
            Message::Text(text) => {
                let value: Value = serde_json::from_str(text.as_str()).unwrap();

                match value["@type"].as_str().unwrap() {
                    "Initial" => {
                        let message: InitialMessage = serde_json::from_value(value).unwrap();

                        log::debug!("Got message: {:?}", message);

                        let mut by_port: HashMap<u16, HashSet<Ipv4Addr>> = HashMap::new();
                        for address in message.accepts {
                            by_port.entry(address.port())
                                .or_default()
                                .insert(address.ip().clone());
                        }

                        for (port, accepts) in by_port {
                            if let Some(chain) = state.provide_chain(&config, port) {
                                chain.update_accepts(accepts).unwrap();
                            } else {
                                log::error!("Received InitialMessage for not-allowed port ({}): {:?}", port, accepts);
                            }
                        }
                    }
                    "Event" => {
                        let message: EventMessage = serde_json::from_value(value).unwrap();
                        log::debug!("Got message: {:?}", message);

                        if let Some(chain) = state.provide_chain(&config, message.inbound.port()) {
                            match message.action {
                                Action::ALLOW => chain.add_accept(message.inbound.ip().clone()).unwrap(),
                                Action::REVOKE => chain.remove_accept(message.inbound.ip().clone()).unwrap()
                            };
                        } else {
                            log::error!("Received EventMessage for not-allowed port: {:?}", message);
                        }
                    }
                    _ => panic!("Unknown type: {}", value)
                }
            }
            Message::Binary(_) => { panic!("Unexpected binary message") }
            _ => {}
        }
    }
    Ok(())
}