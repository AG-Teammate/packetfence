package mac

import (
	"testing"
)

func TestStringify(t *testing.T) {
	if Zero.String() != "00:00:00:00:00:00" {
		t.Errorf("Zero stringify")
	}

	newFromBytesTests := []struct {
		err    error
		bytes  []byte
		macStr string
	}{
		{nil, []byte{0x11, 0x22, 0x33, 0x44, 0x55, 0x66}, "11:22:33:44:55:66"},
		{ErrNotEnoughBytes, []byte{0x11, 0x22, 0x33, 0x44, 0x55}, "00:00:00:00:00:00"},
	}

	for _, test := range newFromBytesTests {
		mac, err := NewFromBytes(test.bytes...)
		if err != test.err {
			t.Errorf("Error is not valid")
		}

		if mac.String() != test.macStr {
			t.Errorf("Mac not stringify ")
		}
	}

	newFromStringTests := []struct {
		err                         error
		fromStr, macStr, decimalStr string
	}{
		{nil, "1122.3344.5566", "11:22:33:44:55:66", "17.34.51.68.85.102"},
		{nil, "1122.3344.5566:Bob SSID", "11:22:33:44:55:66", "17.34.51.68.85.102"},
		{nil, "112.233.445.566", "11:22:33:44:55:66", "17.34.51.68.85.102"},
		{nil, "112.233.445.566:Bob SSID", "11:22:33:44:55:66", "17.34.51.68.85.102"},
		{nil, "11:22:33:44:55:66", "11:22:33:44:55:66", "17.34.51.68.85.102"},
		{nil, "11:22:33:44:55:66:Bob SSID", "11:22:33:44:55:66", "17.34.51.68.85.102"},
		{nil, "11-22-33-44-55-66", "11:22:33:44:55:66", "17.34.51.68.85.102"},
		{nil, "11-22-33-44-55-66:Bob SSID", "11:22:33:44:55:66", "17.34.51.68.85.102"},
		{nil, "AA:BB:CC:DD:EE:FF", "aa:bb:cc:dd:ee:ff", "170.187.204.221.238.255"},
		{nil, "FF:EE:DD:CC:BB:AA", "ff:ee:dd:cc:bb:aa", "255.238.221.204.187.170"},
		{ErrInvalidFormat, "FF:EE:DD:CC:BB:AZ", "00:00:00:00:00:00", "0.0.0.0.0.0"},
		{ErrNotEnoughBytes, "", "00:00:00:00:00:00", "0.0.0.0.0.0"},
		{ErrNotEnoughBytes, "zerererere", "00:00:00:00:00:00", "0.0.0.0.0.0"},
		{ErrInvalidFormat, "abcdefghijkl", "00:00:00:00:00:00", "0.0.0.0.0.0"},
	}

	for i, test := range newFromStringTests {
		mac, err := NewFromString(test.fromStr)
		if err != test.err {
			t.Errorf("Test %d) Error is not valid expected '%s', got '%s'.", i, test.err, err)
		}

		if mac.String() != test.macStr {
			t.Errorf("Test %d) Mac not stringify.", i)
		}

		if mac.Decimal() != test.decimalStr {
			t.Errorf("Test %d) invalid to decimalStr expected '%s' got '%s'", i, test.decimalStr, mac.Decimal())
		}
	}
}
