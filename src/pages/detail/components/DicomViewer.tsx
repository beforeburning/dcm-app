import React from 'react'
import { DcmFile } from '../../../api/dcm'

interface DicomViewerProps {
  files: DcmFile[]
  qiniuBaseUrl: string
}

const DicomViewer: React.FC<DicomViewerProps> = ({ files, qiniuBaseUrl }) => {
  if (files.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-white">
        没有可显示的DICOM文件
      </div>
    )
  }

  return <div className="h-full flex flex-col">{JSON.stringify(files)}</div>
}

export default DicomViewer
