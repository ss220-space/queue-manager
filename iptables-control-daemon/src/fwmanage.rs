use std::collections::HashSet;
use std::error::Error;
use std::net::Ipv4Addr;
use iptables;
use iptables::IPTables;
use lazy_static::lazy_static;
use regex::Regex;

pub(crate) struct FwChain {
    name: String,
    interfaces: Vec<String>,
    inbound_port: u16,
    accepts: HashSet<Ipv4Addr>,
    redirect_port: u16
}

type IPTablesResult<T> = Result<T, Box<dyn Error>>;

lazy_static! {
    static ref IPTABLES: IPTables = iptables::new(false).unwrap();
}

impl FwChain {

    pub fn new(name: String, interfaces: Vec<String>, inbound_port: u16, redirect_port: u16) -> Self {
        return Self {
            name,
            interfaces,
            inbound_port,
            accepts: HashSet::new(),
            redirect_port
        }
    }

    fn restore(&mut self) -> IPTablesResult<()> {
        lazy_static! {
            static ref RULE_REGEX: Regex = Regex::new(r"-s ([0-9.]+)/32 -p tcp -j ACCEPT").unwrap();
        };
        let rules = IPTABLES.list("nat", self.name.as_str())?;
        for rule in &rules {
            if let Some(matches) = RULE_REGEX.captures(rule.as_str()) {
                let ip: Ipv4Addr = (&matches[1]).parse().unwrap();
                self.accepts.insert(ip);
            }
        }
        log::info!("Restored: {:?}, rules: {:?}", self.accepts, rules);
        Ok(())
    }

    pub fn init(&mut self) -> IPTablesResult<()> {
        if !IPTABLES.list_chains("nat")?.contains(&self.name) {
            IPTABLES.new_chain("nat", self.name.as_str())?;
        }
        IPTABLES.append_replace("nat", self.name.as_str(), format!("-p tcp -j REDIRECT --to-port {}", self.redirect_port).as_str())?;
        for interface in &self.interfaces {
            IPTABLES.append_replace("nat", "PREROUTING", self.jump_rule(interface).as_str())?;
        }
        self.restore()
    }

    fn jump_rule(&self, interface: &str) -> String {
        return format!("-i {} -p tcp --dport {} --jump {}", interface, self.inbound_port, self.name);
    }

    pub fn cleanup(&mut self) -> IPTablesResult<()> {
        IPTABLES.flush_chain("nat", self.name.as_str())?;
        for interface in &self.interfaces {
            IPTABLES.delete_all("nat", "PREROUTING", self.jump_rule(interface).as_str())?;
        }
        IPTABLES.delete_chain("nat", self.name.as_str())
    }

    fn accept_rule(ip: Ipv4Addr) -> String {
        format!("-p tcp -j ACCEPT -s {}", ip)
    }

    // before = [1, 2, 3]
    // after = [2, 3, 4]
    // before - after = [1] -- to delete
    // after - before = [4] -- to add
    pub fn update_accepts(&mut self, new_accepts: HashSet<Ipv4Addr>) -> IPTablesResult<()> {
        let prev_accepts = self.accepts.clone();
        for to_remove in prev_accepts.difference(&new_accepts) {
            self.remove_accept(to_remove.clone())?;
        }

        for to_add in new_accepts.difference(&prev_accepts) {
            self.add_accept(to_add.clone())?;
        }
        assert_eq!(self.accepts, new_accepts);
        Ok(())
    }

    pub fn add_accept(&mut self, ip: Ipv4Addr) -> IPTablesResult<()> {
        if self.accepts.insert(ip) {
            IPTABLES.insert(
                "nat", self.name.as_str(),
                Self::accept_rule(ip).as_str(),
                1
            )?;
        }
        Ok(())
    }

    pub fn remove_accept(&mut self, ip: Ipv4Addr) -> IPTablesResult<()> {
        if self.accepts.remove(&ip) {
            IPTABLES.delete_all(
                "nat", self.name.as_str(),
                Self::accept_rule(ip).as_str()
            )?;
        }
        Ok(())
    }
}