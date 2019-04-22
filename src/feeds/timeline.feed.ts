import { Expose } from 'class-transformer';
import { sample } from 'lodash';
import { Feed } from '../core/feed';
import { TimelineFeedReason } from '../types/timeline-feed.reason';
import { TimelineFeedResponse, TimelineFeedResponseMedia_or_ad } from '../responses';

export class TimelineFeed extends Feed<TimelineFeedResponse, TimelineFeedResponseMedia_or_ad> {
  tag: string;
  @Expose()
  private nextMaxId: string;
  public reason: TimelineFeedReason = sample(['pull_to_refresh', 'warm_start_fetch', 'cold_start_fetch']);

  set state(body) {
    this.moreAvailable = body.more_available;
    this.nextMaxId = body.next_max_id;
  }

  async request() {
    let form = {
      is_prefetch: '0',
      feed_view_info: '',
      seen_posts: '',
      phone_id: this.client.state.phoneId,
      is_pull_to_refresh: '0',
      battery_level: this.client.state.batteryLevel,
      timezone_offset: this.client.state.timezoneOffset,
      _csrftoken: this.client.state.CSRFToken,
      client_session_id: this.client.state.sessionId,
      device_id: this.client.state.uuid,
      _uuid: this.client.state.uuid,
      is_charging: Number(this.client.state.isCharging),
      is_async_ads_in_headload_enabled: 0,
      rti_delivery_backend: 0,
      is_async_ads_double_request: 0,
      will_sound_on: 0,
      is_async_ads_rti: 0,
    };
    if (this.nextMaxId) {
      form = Object.assign(form, {
        max_id: this.nextMaxId,
        reason: 'pagination',
      });
    } else {
      form = Object.assign(form, {
        reason: this.reason,
        is_pull_to_refresh: this.reason === 'pull_to_refresh' ? '1' : '0',
      });
    }
    const { body } = await this.client.request.send<TimelineFeedResponse>({
      url: `/api/v1/feed/timeline/`,
      method: 'POST',
      form,
    });
    this.state = body;
    return body;
  }

  async items() {
    const response = await this.request();
    return response.feed_items.filter(i => i.media_or_ad).map(i => i.media_or_ad);
  }
}