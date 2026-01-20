import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class SubmissionClient {
  private readonly logger = new Logger(SubmissionClient.name);
  private readonly baseUrl = process.env.SUBMISSION_SERVICE_URL || 'http://localhost:3003/api';

  /**
   * Lấy danh sách submissions theo conference ID từ submission-service
   * Sử dụng internal endpoint (không cần auth)
   */
  async getSubmissionsByConference(conferenceId: string) {
    const url = `${this.baseUrl}/internal/submissions/conference/${conferenceId}`;
    
    try {
      this.logger.log(`[SubmissionClient] SUBMISSION_SERVICE_URL env: ${process.env.SUBMISSION_SERVICE_URL}`);
      this.logger.log(`[SubmissionClient] Base URL: ${this.baseUrl}`);
      this.logger.log(`[SubmissionClient] Full URL: ${url}`);
      this.logger.log(`[SubmissionClient] Fetching submissions for conference: ${conferenceId}`);
      
      const response = await axios.get(url, {
        timeout: 10000,
        validateStatus: () => true, // Accept all status codes
      });

      this.logger.log(`[SubmissionClient] Response status: ${response.status}`);
      this.logger.log(`[SubmissionClient] Response headers: ${JSON.stringify(response.headers)}`);
      this.logger.log(`[SubmissionClient] Response data: ${JSON.stringify(response.data)}`);

      if (response.status !== 200) {
        this.logger.error(`[SubmissionClient] Non-200 status: ${response.status} - ${JSON.stringify(response.data)}`);
        
        if (response.status === 404) {
          return {
            status: 'success',
            data: []
          };
        }
        
        if (response.status === 503) {
          throw new InternalServerErrorException('Submission service is unavailable');
        }
      }

      this.logger.log(`[SubmissionClient] Successfully fetched ${response.data?.data?.length || 0} submissions`);
      return response.data;
    } catch (error) {
      this.logger.error(`[SubmissionClient] Catch error: ${error.message}`);
      if (axios.isAxiosError(error)) {
        this.logger.error(`[SubmissionClient] Axios error - Code: ${error.code}, Status: ${error.response?.status}`);
        this.logger.error(`[SubmissionClient] Axios error - Message: ${error.message}`);
        this.logger.error(`[SubmissionClient] Axios error - Response: ${JSON.stringify(error.response?.data)}`);
      }
      
      // Nếu là development mode, cho phép fallback
      if (process.env.NODE_ENV === 'development') {
        this.logger.warn(`⚠️ [DEV MODE] Cannot reach Submission Service - returning empty list`);
        return {
          status: 'success',
          data: []
        };
      }

      throw new InternalServerErrorException('Cannot fetch submissions at this moment');
    }
  }

  /**
   * Lấy chi tiết một submission theo submission ID
   */
  async getSubmissionById(submissionId: number) {
    try {
      this.logger.log(`[SubmissionClient] Fetching submission: ${submissionId}`);
      
      const response = await axios.get(
        `${this.baseUrl}/internal/submissions/${submissionId}`,
        {
          timeout: 10000,
        }
      );

      return response.data;
    } catch (error) {
      this.logger.error(`[SubmissionClient] Error fetching submission ${submissionId}: ${error}`);
      
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }

      throw new InternalServerErrorException('Cannot fetch submission at this moment');
    }
  }
}
