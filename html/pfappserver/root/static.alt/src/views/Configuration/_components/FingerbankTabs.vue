<template>
  <b-card no-body>
    <b-card-header>
      <h4 class="mb-3" v-t="'Fingerbank Profiling'"></h4>
      <b-button class="mb-1" size="sm" variant="outline-primary" :disabled="isUpdateDatabaseLoading" @click="updateDatabase()">
        <icon class="mr-1" name="sync" :spin="isUpdateDatabaseLoading"></icon>
        {{ $t('Update Fingerbank Database') }}
      </b-button>
    </b-card-header>
    <b-tabs ref="tabs" v-model="tabIndex" card>
      <b-tab :title="$t('General Settings')" @click="changeTab('general_settings')">
        <fingerbank-general-setting-view form-store-name="formFingerbankGeneralSettings" />
      </b-tab>
      <b-tab :title="$t('Device change detection')" @click="changeTab('device_change_detection')">
        <fingerbank-device-change-detection-view form-store-name="formFingerbankDeviceChangeDetection" />
      </b-tab>
      <b-tab :title="$t('Combinations')" @click="changeTab('combinations')">
        <fingerbank-combinations-list />
      </b-tab>
      <b-tab :title="$t('Devices')" @click="changeTab('devices')">
        <fingerbank-devices-list :parentId="parentId"/>
      </b-tab>
      <b-tab :title="$t('DHCP Fingerprints')" @click="changeTab('dhcp_fingerprints')">
        <fingerbank-dhcp-fingerprints-list />
      </b-tab>
      <b-tab :title="$t('DHCP Vendors')" @click="changeTab('dhcp_vendors')">
        <fingerbank-dhcp-vendors-list />
      </b-tab>
      <b-tab :title="$t('DHCPv6 Fingerprints')" @click="changeTab('dhcpv6_fingerprints')">
        <fingerbank-dhcpv6-fingerprints-list />
      </b-tab>
      <b-tab :title="$t('DHCPv6 Enterprises')" @click="changeTab('dhcpv6_enterprises')">
        <fingerbank-dhcpv6-enterprises-list />
      </b-tab>
      <b-tab :title="$t('MAC Vendors')" @click="changeTab('mac_vendors')">
        <fingerbank-mac-vendors-list />
      </b-tab>
      <b-tab :title="$t('User Agents')" @click="changeTab('user_agents')">
        <fingerbank-user-agents-list />
      </b-tab>
    </b-tabs>
  </b-card>
</template>

<script>
import FormStore from '@/store/base/form'
import FingerbankGeneralSettingView from './FingerbankGeneralSettingView'
import FingerbankDeviceChangeDetectionView from './FingerbankDeviceChangeDetectionView'
import FingerbankCombinationsList from './FingerbankCombinationsList'
import FingerbankDevicesList from './FingerbankDevicesList'
import FingerbankDhcpFingerprintsList from './FingerbankDhcpFingerprintsList'
import FingerbankDhcpVendorsList from './FingerbankDhcpVendorsList'
import FingerbankDhcpv6FingerprintsList from './FingerbankDhcpv6FingerprintsList'
import FingerbankDhcpv6EnterprisesList from './FingerbankDhcpv6EnterprisesList'
import FingerbankMacVendorsList from './FingerbankMacVendorsList'
import FingerbankUserAgentsList from './FingerbankUserAgentsList'

export default {
  name: 'fingerbank-tabs',
  components: {
    FingerbankGeneralSettingView,
    FingerbankDeviceChangeDetectionView,
    FingerbankCombinationsList,
    FingerbankDevicesList,
    FingerbankDhcpFingerprintsList,
    FingerbankDhcpVendorsList,
    FingerbankDhcpv6FingerprintsList,
    FingerbankDhcpv6EnterprisesList,
    FingerbankMacVendorsList,
    FingerbankUserAgentsList
  },
  props: {
    tab: {
      type: String,
      default: 'general_settings'
    },
    parentId: {
      type: String,
      default: null
    }
  },
  computed: {
    tabIndex () {
      return [
        'general_settings',
        'device_change_detection',
        'combinations',
        'devices',
        'dhcp_fingerprints',
        'dhcp_vendors',
        'dhcpv6_fingerprints',
        'dhcpv6_enterprises',
        'mac_vendors',
        'user_agents'
      ].indexOf(this.tab)
    },
    isUpdateDatabaseLoading () {
      return this.$store.getters['$_fingerbank/isUpdateDatabaseLoading']
    }
  },
  methods: {
    changeTab (path) {
      this.$router.push(`/configuration/fingerbank/${path}`)
    },
    updateDatabase () {
      this.$store.dispatch('$_fingerbank/updateDatabase')
    }
  },
  beforeMount () {
    if (!this.$store.state.formFingerbankGeneralSettings) { // Register store module only once
      this.$store.registerModule('formFingerbankGeneralSettings', FormStore)
    }
    if (!this.$store.state.formFingerbankDeviceChangeDetection) { // Register store module only once
      this.$store.registerModule('formFingerbankDeviceChangeDetection', FormStore)
    }
  }
}
</script>
