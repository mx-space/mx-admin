import { Table } from 'components/table'
import { useTable } from 'hooks/use-table'
import { ContentLayout } from 'layouts/content'
import { NButton, NCard, NModal, NSpace, NTabPane, NTabs } from 'naive-ui'
import { socket } from 'socket'
import { EventTypes } from 'socket/types'
import { RESTManager } from 'utils'
import { bus } from 'utils/event-bus'
import { Terminal } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'
import 'xterm/css/xterm.css'

export default defineComponent({
  setup() {
    return () => (
      <ContentLayout>
        <NTabs size="medium">
          <NTabPane name={'PM2 日志'}>
            <PM2Log />
          </NTabPane>
          <NTabPane name={'实时'}>
            <RealtimePipeline />
          </NTabPane>
        </NTabs>
      </ContentLayout>
    )
  },
})

const RealtimePipeline = defineComponent({
  setup() {
    const listen = () => {
      socket.socket.emit('log')
    }

    let term: Terminal
    const xtermHandler = (e) => {
      term?.write(e)
    }
    const termRef = ref<HTMLElement>()
    onMounted(() => {
      listen()

      term = new Terminal({
        rows: 40,
      })
      const fitAddon = new FitAddon()
      term.loadAddon(fitAddon)

      term.open(termRef.value!)
      fitAddon.fit()
      term.setOption('scrollback', 1000000)
      term.setOption('disableStdin', true)
      term.setOption('convertEol', true)
      bus.on(EventTypes.STDOUT, xtermHandler)
    })

    onUnmounted(() => {
      socket.socket.emit('unlog')

      bus.off(EventTypes.STDOUT, xtermHandler)
    })

    return () => (
      <div>
        <p>
          使用 PM2 托管的应用不受支持, 可以使用 PM2 命令行工具或 PM2 Plus
          查看日志.
        </p>
        <div id="xterm" class="max-h-[70vh]" ref={termRef}></div>
      </div>
    )
  },
})

const PM2Log = defineComponent({
  setup() {
    const { fetchDataFn, data, loading } = useTable((data) => {
      return async () => {
        const { data: data$ } =
          await RESTManager.api.health.log.list.pm2.get<any>()

        data.value = data$
      }
    })
    onMounted(() => {
      fetchDataFn()
    })
    const logData = ref('')
    const showLog = ref(false)
    return () => (
      <Fragment>
        <NModal
          show={showLog.value}
          onUpdateShow={(s) => void (showLog.value = s)}
        >
          <NCard
            title="查看日志"
            class="modal-card !w-[100rem]"
            bordered={false}
            closable
            onClose={() => {
              showLog.value = false
            }}
          >
            <LogDisplay data={logData.value} />
          </NCard>
        </NModal>
        <Table
          noPagination
          data={data}
          loading={loading.value}
          columns={[
            { title: '文件', key: 'filename' },
            { title: '大小', key: 'size', width: 200 },
            { title: '类型', key: 'type', width: 200 },
            {
              title: '操作',
              key: '',
              fixed: 'right',
              render(row) {
                return (
                  <NSpace>
                    <NButton
                      text
                      type="success"
                      size="tiny"
                      onClick={() => {
                        RESTManager.api.health.log.pm2
                          .get({
                            params: {
                              type: row.type,
                              index: row.index,
                            },
                          })
                          .then((data: any) => {
                            logData.value = data.data
                            showLog.value = true
                          })
                      }}
                    >
                      查看
                    </NButton>
                  </NSpace>
                )
              },
            },
          ]}
        />
      </Fragment>
    )
  },
})

const LogDisplay = defineComponent({
  props: {
    data: {
      type: String,
      default: '',
    },
  },
  setup(props) {
    const termRef = ref<HTMLElement>()
    onMounted(() => {
      const term = new Terminal({
        rows: 40,
      })
      const fitAddon = new FitAddon()
      term.loadAddon(fitAddon)

      term.open(termRef.value!)
      setTimeout(() => {
        fitAddon.fit()
        term.write(props.data)
      }, 1000)
      term.setOption('scrollback', 1000000)
      term.setOption('disableStdin', true)
      term.setOption('convertEol', true)
    })
    return () => <div class="w-full overflow-auto bg-black" ref={termRef}></div>
  },
})
