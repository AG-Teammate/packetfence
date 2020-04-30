/**
* "$_live_log" store module
*/
import Vue from 'vue'
import api from '../_api'
import { createDebouncer } from 'promised-debounce'
import i18n from '@/utils/locale'

const scopes = {

}

// Default values
const state = () => {
  return {
    session: {},
    events: [],
    filters: {},
    scopes: {
      hostname: {
        label: i18n.t('Hostname'),
        values: {
          "": { count: 0 }
        }
      },
      log_level: {
        label: i18n.t('Log Level'),
        values: {
          "": { count: 0 }
        }
      },
      process: {
        label: i18n.t('Process Name'),
        values: {
          "": { count: 0 }
        }
      },
      syslog_name: {
        label: i18n.t('Syslog Name'),
        values: {
          "": { count: 0 }
        }
      }
    },
    debouncer: false,
    debouncerMs: 300, // 300ms
    message: '',
    status: ''
  }
}

const getters = {
  isLoading: state => state.status === 'loading',
  session: state => state.session,
  events: state => state.events,
  scopes: state => state.scopes,
  filters: state => state.filters,
  isFiltered: state => (scope, key) => {
    const { scopes: { [scope]: { values: { [key]: { filter = false } = {} } = {} } = {} } = {} } = state
    return filter
  },
  eventsFiltered: (state, getters) => {
    const fk = Object.keys(state.filters)
    if (fk.length === 0) {
      return state.events
    }
    return state.events.filter(event => {
      const { data: { meta: { timestamp, log_without_prefix, ...meta } = {} } = {} } = event
      for (let i = 0; i < fk.length; i++) {
        let k = fk[i]
        let a = state.filters[k]
        if (!a.includes(meta[k])) {
          return false
        }
      }
      return event
    })
  }
}

const actions = {
  setSession: ({ commit, dispatch }, session) => {
    commit('SET_SESSION', { session, dispatch })
  },
  getSession: ({ state, commit, dispatch }) => {
    commit('LOG_SESSION_REQUEST')
    return api.getLogTailSession(state.session.session_id).then(response => {
      commit('LOG_SESSION_RESPONSE', response)
      commit('LOG_SESSION_QUEUE', dispatch) // queue the next request
      return response
    }).catch(err => {
      commit('LOG_SESSION_ERROR', err.response)
      //commit('LOG_SESSION_QUEUE', dispatch) // queue the next request
      return err
    })
  },
  toggleFilter: ({ state, getters, commit }, { scope, key }) => {
    if (getters.isFiltered(scope, key)) { // disable
      commit('LOG_FILTER_DISABLE', { scope, key })
      commit('UPDATE_FILTERS')
    }
    else { //enable
      commit('LOG_FILTER_ENABLE', { scope, key })
      commit('UPDATE_FILTERS')
    }
  }
}

const mutations = {
  SET_SESSION: (state, { session, dispatch }) => {
    state.session = session
    dispatch('getSession')
  },
  LOG_SESSION_QUEUE: (state, dispatch) => {
    if (!state.debouncer) {
      state.debouncer = createDebouncer()
    }
    state.debouncer({
      handler: () => {
        dispatch('getSession')
      },
      time: state.debouncerMs
    })
  },
  LOG_SESSION_REQUEST: (state) => {
    state.status = 'loading'
    state.message = ''
  },
  LOG_SESSION_RESPONSE: (state, response) => {
    state.status = 'success'
    const { events } = response
    if (events) {
      state.events = [ ...state.events, ...events ]
      for (let event of events) {
        const { data: { meta: { timestamp, log_without_prefix, ...meta } = {} } = {} } = event
        for (let key of Object.keys(meta)) {
          if (!(key in state.scopes)) {
            state.scopes[key].values = { [meta[key]]: { count: 1 } }
          }
          else if (!(meta[key] in state.scopes[key].values)) {
            state.scopes[key].values = Object.entries({
              ...state.scopes[key].values,
              [meta[key]]: { count: 1 }
            }).sort(([a], [b]) => {
              if (!a) return -1
              if (!b) return 1
              return +a - +b
            }).reduce((r, [k, v]) => {
              return { ...r, [k]: v }
            }, {})
          }
          else {
            state.scopes[key].values[meta[key]].count++
          }
        }
      }
    }
  },
  LOG_SESSION_ERROR: (state, response) => {
    state.status = 'error'
    if (response && response.data) {
      state.message = response.data.message
    }
  },
  LOG_FILTER_ENABLE: (state, { scope, key }) => {
    state.scopes[scope].values[key].filter = true
  },
  LOG_FILTER_DISABLE: (state, { scope, key }) => {
    state.scopes[scope].values[key].filter = false
  },
  UPDATE_FILTERS: (state) => {
    state.filters = Object.entries(state.scopes).reduce((r, [k, { values: f }]) => {
      let v = Object.entries(f).reduce((r, [k, v]) => {
        return (v.filter) ? [ ...r, k ] : r
      }, [])
      return {
        ...r,
        ...((v.length > 0) ? { [k]: v } : {})
      }
    }, {})
  }
}

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
}
