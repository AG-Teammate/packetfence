import i18n from '@/utils/locale'
import pfFormInput from '@/components/pfFormInput'
import pfFormFields from '@/components/pfFormFields'
import pfFormChosen from '@/components/pfFormChosen'
import pfFormRangeToggle from '@/components/pfFormRangeToggle'
import pfFormSecurityEventTrigger from '@/components/pfFormSecurityEventTrigger'
import pfFormSecurityEventTriggerHeader from '@/components/pfFormSecurityEventTriggerHeader'
import pfFormSecurityEventActions from '@/components/pfFormSecurityEventActions'
import {
  pfConfigurationAttributesFromMeta,
  pfConfigurationValidatorsFromMeta
} from '@/globals/configuration/pfConfiguration'
import { pfSearchConditionType as conditionType } from '@/globals/pfSearch'
import {
  and,
  not,
  conditional,
  hasSecurityEvents,
  securityEventExists
} from '@/globals/pfValidators'

const {
  required
} = require('vuelidate/lib/validators')

export const pfConfigurationSecurityEventsListColumns = [
  {
    key: 'enabled',
    label: i18n.t('Status'),
    required: true,
    sortable: true,
    visible: true
  },
  {
    key: 'id',
    label: 'ID',
    sortable: true,
    visible: true
  },
  {
    key: 'desc',
    label: i18n.t('Description'),
    sortable: true,
    visible: true
  },
  {
    key: 'priority',
    label: 'Priority',
    sortable: true,
    visible: true
  },
  {
    key: 'template',
    label: i18n.t('Template'),
    visible: true
  },
  {
    key: 'buttons',
    label: '',
    locked: true
  }
]

export const pfConfigurationSecurityEventsListFields = [
  {
    value: 'id',
    text: i18n.t('Identifier'),
    types: [conditionType.SUBSTRING]
  },
  {
    value: 'description',
    text: i18n.t('Description'),
    types: [conditionType.SUBSTRING]
  }
]

export const pfConfigurationSecurityEventViewFields = (context = {}) => {
  const {
    isNew = false,
    isClone = false,
    id = '',
    form = {},
    options: {
      meta = {}
    }
  } = context
  return [
    {
      tab: null, // ignore tabs
      fields: [
        {
          label: i18n.t('Enable security event'),
          fields: [
            {
              key: 'enabled',
              component: pfFormRangeToggle,
              attrs: {
                disabled: id === 'defaults',
                values: { checked: 'Y', unchecked: 'N' },
                colors: { checked: 'var(--success)', unchecked: 'var(--danger)' }
              }
            }
          ]
        },
        {
          label: i18n.t('Identifier'),
          fields: [
            {
              key: 'id',
              component: pfFormInput,
              attrs: {
                ...pfConfigurationAttributesFromMeta(meta, 'id'),
                ...{
                  disabled: (!isNew && !isClone)
                }
              },
              validators: {
                ...pfConfigurationValidatorsFromMeta(meta, 'id', 'ID'),
                ...{
                  [i18n.t('Security event exists.')]: not(and(required, conditional(isNew || isClone), hasSecurityEvents, securityEventExists))
                }
              }
            }
          ]
        },
        {
          label: i18n.t('Description'),
          fields: [
            {
              key: 'desc',
              component: pfFormInput,
              attrs: pfConfigurationAttributesFromMeta(meta, 'desc'),
              validators: pfConfigurationValidatorsFromMeta(meta, 'desc', i18n.t('Description'))
            }
          ]
        },
        {
          label: i18n.t('Priority'),
          text: i18n.t('When multiple violations are opened for an endpoint, the one with the lowest priority takes precedence.'),
          fields: [
            {
              key: 'priority',
              component: pfFormInput,
              attrs: pfConfigurationAttributesFromMeta(meta, 'priority'),
              validators: pfConfigurationValidatorsFromMeta(meta, 'priority', i18n.t('Priority'))
            }
          ]
        },
        {
          label: i18n.t('Ignored Roles'),
          text: i18n.t(`Which roles shouldn't be impacted by this security event.`),
          fields: [
            {
              key: 'whitelisted_roles',
              component: pfFormChosen,
              attrs: pfConfigurationAttributesFromMeta(meta, 'whitelisted_roles'),
              validators: pfConfigurationValidatorsFromMeta(meta, 'whitelisted_roles', i18n.t('Roles'))
            }
          ]
        },
        {
          label: i18n.t('Event Triggers'),
          if: (form.triggers && form.triggers.length),
          fields: [
            {
              component: pfFormSecurityEventTriggerHeader
            }
          ]
        },
        {
          label: ' ',
          fields: [
            {
              key: 'triggers',
              component: pfFormFields,
              attrs: {
                buttonLabel: i18n.t('Add Trigger'),
                sortable: true,
                field: {
                  component: pfFormSecurityEventTrigger,
                  attrs: { meta }
                }
              }
            }
          ]
        },
        {
          label: i18n.t('Event Actions'),
          fields: [
            {
              key: '', // use the model itself
              component: pfFormSecurityEventActions,
              attrs: { meta }
            }
          ]
        },
        {
          label: i18n.t('Dynamic Window'),
          text: i18n.t('Only works for accounting security events. The security event will be opened according to the time you set in the accounting security event (ie. You have an accounting security event for 10GB/month. If you bust the bandwidth after 3 days, the security event will open and the release date will be set for the last day of the current month).'),
          fields: [
            {
              key: 'window_dynamic',
              component: pfFormRangeToggle,
              attrs: {
                values: { checked: 'enabled', unchecked: 'disabled' }
              }
            }
          ]
        },
        {
          label: i18n.t('Grace'),
          text: i18n.t('Amount of time before the security event can reoccur. This is useful to allow hosts time (in the example 2 minutes) to download tools to fix their issue, or shutoff their peer-to-peer application.'),
          fields: [
            {
              key: 'grace.interval',
              component: pfFormInput,
              attrs: pfConfigurationAttributesFromMeta(meta, 'grace.interval'),
              validators: pfConfigurationValidatorsFromMeta(meta, 'grace.interval', i18n.t('Interval'))
            },
            {
              key: 'grace.unit',
              component: pfFormChosen,
              attrs: pfConfigurationAttributesFromMeta(meta, 'grace.unit'),
              validators: pfConfigurationValidatorsFromMeta(meta, 'grace.unit', i18n.t('Unit'))
            }
          ]
        },
        {
          label: i18n.t('Window'),
          text: i18n.t('Amount of time before a security event will be closed automatically. Instead of allowing people to reactivate the network, you may want to open a security event for a defined amount of time instead.'),
          fields: [
            {
              key: 'window.interval',
              component: pfFormInput,
              attrs: pfConfigurationAttributesFromMeta(meta, 'window.interval'),
              validators: pfConfigurationValidatorsFromMeta(meta, 'window.interval', i18n.t('Interval'))
            },
            {
              key: 'window.unit',
              component: pfFormChosen,
              attrs: pfConfigurationAttributesFromMeta(meta, 'window.unit'),
              validators: pfConfigurationValidatorsFromMeta(meta, 'window.unit', i18n.t('Unit'))
            }
          ]
        },
        {
          label: i18n.t('Delay By'),
          text: i18n.t('Delay before triggering the security event.'),
          fields: [
            {
              key: 'delay_by.interval',
              component: pfFormInput,
              attrs: pfConfigurationAttributesFromMeta(meta, 'delay_by.interval'),
              validators: pfConfigurationValidatorsFromMeta(meta, 'delay_by.interval', i18n.t('Interval'))
            },
            {
              key: 'delay_by.unit',
              component: pfFormChosen,
              attrs: pfConfigurationAttributesFromMeta(meta, 'delay_by.unit'),
              validators: pfConfigurationValidatorsFromMeta(meta, 'delay_by.unit', i18n.t('Unit'))
            }
          ]
        }
      ]
    }
  ]
}

export const pfConfigurationSecurityEventListConfig = () => {
  return {
    columns: pfConfigurationSecurityEventsListColumns,
    fields: pfConfigurationSecurityEventsListFields,
    rowClickRoute (item) {
      return { name: 'security_event', params: { id: item.id } }
    },
    searchPlaceholder: i18n.t('Search by identifier or description'),
    searchableOptions: {
      searchApiEndpoint: 'config/security_events',
      defaultSortKeys: [],
      defaultSearchCondition: {
        op: 'and',
        values: [{
          op: 'or',
          values: [
            { field: 'id', op: 'contains', value: null },
            { field: 'desc', op: 'contains', value: null }
          ]
        }]
      },
      defaultRoute: { name: 'security_events' }
    },
    searchableQuickCondition: (quickCondition) => {
      return {
        op: 'and',
        values: [
          {
            op: 'or',
            values: [
              { field: 'id', op: 'contains', value: quickCondition },
              { field: 'desc', op: 'contains', value: quickCondition }
            ]
          }
        ]
      }
    }
  }
}
