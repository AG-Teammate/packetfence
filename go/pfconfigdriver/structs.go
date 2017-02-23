package pfconfigdriver

import (
	"context"
	"encoding/json"
	"net"
	"time"
)

// Interface for a pfconfig object. Not doing much now but it is there for future-proofing
type PfconfigObject interface {
	GetLoadedAt() time.Time
	SetLoadedAt(time.Time)
}

// A basic StructConfig that contains the loaded at time which ensures FetchDecodeSocketCache will refresh the struct when needed
// FetchDecodeSocket can be used by structs that don't include this one, but the pool uses FetchDecodeSocketCache so this struct should always be included in the pfconfig based structs
type StructConfig struct {
	PfconfigLoadedAt time.Time
}

// Set the loaded at of the struct
func (ps *StructConfig) SetLoadedAt(t time.Time) {
	ps.PfconfigLoadedAt = t
}

// Get the loaded at time of the struct
func (ps *StructConfig) GetLoadedAt() time.Time {
	return ps.PfconfigLoadedAt
}

// pfconfig replies with the «struct» nested in an element key of a hash
// ex: {"element":{"data1":"value1", "data2":"value2"}}
// The structs are built to receive the value of element, so in order to have 2 stage decoding, this serves as a receiver for the pfconfig payload which then gets decoded into the right type
type PfconfigElementResponse struct {
	Element *json.RawMessage
}

// To be combined with another struct in order to give it a Type attribute common in PF
type TypedConfig struct {
	Type string `json:"type"`
}

// Represents the pf.conf general section
type PfConfGeneral struct {
	StructConfig
	PfconfigMethod string `val:"hash_element"`
	PfconfigNS     string `val:"config::Pf"`
	PfconfigHashNS string `val:"general"`
	Domain         string `json:"domain"`
	DNS_Servers    string `json:"dnsservers"`
	Timezone       string `json:"timezone"`
	Hostname       string `json:"hostname"`
	DHCP_Servers   string `json:"dhcpservers"`
}

type ManagementNetwork struct {
	StructConfig
	PfconfigMethod string `val:"element"`
	PfconfigNS     string `val:"interfaces::management_network"`
	Ip             string `json:"ip"`
	Vip            string `json:"vip"`
	Mask           string `json:"mask"`
	Int            string `json:"int"`
}

func (mn *ManagementNetwork) GetNetIP(ctx context.Context) (net.IP, *net.IPNet, error) {
	ip, ipnet, err := net.ParseCIDR(mn.Ip + "/" + mn.Mask)
	return ip, ipnet, err
}

// Used when fetching the sections from a pfconfig HASH namespace
// This will store the keys (section names) in the Keys attribute
// **DO NOT** use this directly through the resource pool as the pool is type based which means that all your structs pointing to different namespaces will point to the namespace that was used first
type PfconfigKeys struct {
	StructConfig
	PfconfigMethod string `val:"keys"`
	PfconfigNS     string `val:"-"`
	Keys           []string
}

type configStruct struct {
	Interfaces struct {
		ManagementNetwork ManagementNetwork
	}
	PfConf struct {
		General PfConfGeneral
	}
}

var Config configStruct
