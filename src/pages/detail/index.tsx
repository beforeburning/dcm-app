import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getDcmListRequest, qiniuBaseUrl, type DcmList } from '../../api/dcm'
import DicomViewer from './components/DicomViewer'
import initCornerstone from './components/cornerstone'
// import DicomViewer from '../../components/DicomViewer'

function DetailPage(): React.JSX.Element {
  const { id } = useParams()
  const [dcmData, setDcmData] = useState<DcmList | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDcmData = async (): Promise<void> => {
      try {
        setLoading(true)
        const response = await getDcmListRequest()
        if (response.code === 200 && response.data) {
          const targetDcm = response.data.find((dcm) => dcm.id === id)
          if (targetDcm) {
            setDcmData(targetDcm)
          } else {
            setError('未找到指定的DCM数据')
          }
        } else {
          setError(response.message || '获取数据失败')
        }
      } catch {
        setError('网络错误，请稍后重试')
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchDcmData()
    }
  }, [id])

  useEffect(() => {
    initCornerstone()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-white">加载中...</div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-red-400">错误: {error}</div>
          </div>
        </div>
      </div>
    )
  }

  if (!dcmData) {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-white">未找到数据</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-black text-white">
      <div className="w-full h-full relative">
        {/* {dcmData && <DicomViewer files={dcmData.files} qiniuBaseUrl={qiniuBaseUrl} />} */}
      </div>
    </div>
  )
}

export default DetailPage
