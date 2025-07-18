import { useState, useCallback, useContext, useEffect } from 'react';
import { type MenuProps, Button, Dropdown } from 'antd';
import { SubsessionUserStatus, SubsessionStatus } from '@zoom/videosdk';
import { useSearchParams } from 'react-router';
import ZoomContext from '../../context/zoom-context';
import { useParticipantsChange } from './hooks/useParticipantsChange';
import { IconFont } from '../../component/icon-font';
import Video from '../video/video';
import VideoSingle from '../video/video-single';
import VideoAttach from '../video/video-attach';
import SubsessionCreate from './component/subsession-create';
import SubsessionManage from './component/subsession-manage';
import DraggableModal from './component/draggable-modal';
import type { Participant } from '../../index-types';
import { SubsessionStatusDescription } from './subsession-constant';
import { useSubsessionCountdown } from './hooks/useSubsessionCountdown';
import { useInviteJoinSubsession } from './hooks/useInviteJoinRoom';
import { useBroadcastMessage } from './hooks/useBroadcastMessage';
import { useSubsessionTimeUp } from './hooks/useSubsessionTimeup';
import { useSubsession } from './hooks/useSubsession';
import { useSubsessionClosingCountdown } from './hooks/useSubsessionClosingCountdown';
import { usePrevious } from '../../hooks';
import { useAskForHelp } from './hooks/useAskForHelp';
import MediaContext from '../../context/media-context';
import './subsession.scss';
const SubsessionContainer = () => {
  const [searchParams] = useSearchParams();
  const isUseVideoPlayer = searchParams.get('useVideoPlayer') === '1';
  const zmClient = useContext(ZoomContext);
  const subsessionClient = zmClient.getSubsessionClient();
  const { mediaStream } = useContext(MediaContext);
  const [visible, setVisible] = useState(false);
  const [closingModalVisible, setClosingModalVisible] = useState(false);
  const [isHostOrManager, setIsHostOrManager] = useState(false);
  const [participantsSize, setParticipantsSize] = useState(0);

  const {
    subsessions,
    subsessionStatus,
    userStatus,
    currentSubsession,
    unassignedUserList,
    subsessionOptions,
    setSubsessionOptions,
    createSubsessions,
    addSubsession,
    openSubsessions,
    assignUserToSubsession,
    moveUserToSubsession,
    moveUserBackToMainSession
  } = useSubsession(zmClient, subsessionClient);
  const { invitedToJoin, inviteVisible, setInviteVisible, setInviteAccepted } = useInviteJoinSubsession(zmClient);
  const { formattedSubsessionCountdown } = useSubsessionCountdown(zmClient, subsessionClient);
  useBroadcastMessage(zmClient);
  useSubsessionTimeUp(zmClient, subsessionClient, isHostOrManager, subsessionOptions.timerDuration);
  useAskForHelp(zmClient, subsessionClient);
  const closingCountdown = useSubsessionClosingCountdown(zmClient, subsessionStatus);
  const previousClosingCountdown = usePrevious(closingCountdown);
  const onParticipantsChange = useCallback(
    (participants: Participant[]) => {
      const isHostOrManager = zmClient.isHost() || zmClient.isManager();
      if (visible && !isHostOrManager) {
        setVisible(false);
      }
      setParticipantsSize(participants.length);
      setIsHostOrManager(isHostOrManager);
    },
    [visible, zmClient]
  );
  useParticipantsChange(zmClient, onParticipantsChange);

  const onModalClose = useCallback(() => {
    setVisible(false);
  }, []);

  useEffect(() => {
    if (userStatus !== SubsessionUserStatus.InSubsession) {
      setClosingModalVisible(false);
    }
  }, [userStatus]);
  useEffect(() => {
    if (previousClosingCountdown === -1 && closingCountdown >= 0) {
      setClosingModalVisible(true);
    }
  }, [previousClosingCountdown, closingCountdown]);
  useEffect(() => {
    if (subsessionStatus !== SubsessionStatus.InProgress) {
      setInviteVisible(false);
    }
  }, [subsessionStatus, setInviteVisible]);
  let subsessionModalTitle = `Subsessions -${SubsessionStatusDescription[subsessionStatus]}`;
  let subsessionRemainingTitle;
  if (formattedSubsessionCountdown) {
    subsessionModalTitle = `${subsessionModalTitle} (${formattedSubsessionCountdown})`;
    subsessionRemainingTitle = `Remaining:${formattedSubsessionCountdown}`;
  }
  const onAttendeeBoMenuClick = useCallback(
    ({ key }: any) => {
      if (key === 'askHelp') {
        subsessionClient?.askForHelp();
      } else if (key === 'leaveRoom') {
        subsessionClient?.leaveSubsession();
      } else if (key === 'selectSubsession') {
        setVisible(true);
      }
    },
    [subsessionClient]
  );
  const attendeeBoMenu = {
    theme: 'dark',
    className: 'attendee-bo-menu',
    items: [
      subsessionOptions.isSubsessionSelectionEnabled && {
        key: 'selectSubsession',
        label: 'Choose Subsession'
      },
      subsessionStatus === SubsessionStatus.InProgress && {
        key: 'askHelp',
        label: 'Ask for Help'
      },
      {
        key: 'leaveRoom',
        label: 'Leave Subsession'
      }
    ].filter(Boolean),
    onClick: onAttendeeBoMenuClick
  };
  const isAttendeeReturnToMainSession =
    subsessionStatus === SubsessionStatus.InProgress &&
    currentSubsession.subsessionId &&
    currentSubsession.userStatus === SubsessionUserStatus.Invited;

  return (
    <div className="breakout-room-viewport">
      {mediaStream?.isSupportMultipleVideos() ? isUseVideoPlayer ? <VideoAttach /> : <Video /> : <VideoSingle />}
      {userStatus === SubsessionUserStatus.InSubsession && (
        <h2 className="room-info">You are in {currentSubsession.subsessionName}.</h2>
      )}
      {(isHostOrManager ||
        subsessionOptions.isSubsessionSelectionEnabled ||
        invitedToJoin || // invite to join
        isAttendeeReturnToMainSession) && ( // return to the main session
        <Button
          className="breakout-room-btn"
          shape="circle"
          icon={<IconFont type="icon-group" />}
          onClick={() => {
            if (isHostOrManager || subsessionOptions.isSubsessionSelectionEnabled) {
              setVisible(true);
            } else if (isAttendeeReturnToMainSession) {
              subsessionClient?.joinSubsession(currentSubsession.subsessionId);
            } else {
              if (invitedToJoin?.accepted) {
                subsessionClient?.joinSubsession(invitedToJoin.subsessionId);
              } else {
                setInviteVisible(true);
              }
            }
          }}
        />
      )}
      {!isHostOrManager && userStatus === SubsessionUserStatus.InSubsession && (
        <Dropdown
          className="breakout-room-attendee-dropdown"
          menu={attendeeBoMenu as MenuProps}
          trigger={['click']}
          placement="topLeft"
        >
          <Button shape="circle" icon={<IconFont type="icon-group" />} />
        </Dropdown>
      )}

      {(isHostOrManager || subsessionOptions.isSubsessionSelectionEnabled) && (
        <DraggableModal title={subsessionModalTitle} visible={visible} onClose={onModalClose}>
          {isHostOrManager && subsessions.length === 0 && subsessionStatus === SubsessionStatus.NotStarted ? (
            <SubsessionCreate totalParticipantsSize={participantsSize} onCreateSubsession={createSubsessions} />
          ) : (
            <SubsessionManage
              subsessionStatus={subsessionStatus}
              userStatus={userStatus}
              currentSubsession={currentSubsession}
              subsessions={subsessions}
              subsessionOptions={{ ...subsessionOptions, ...setSubsessionOptions }}
              unassignedUserList={unassignedUserList}
              showActions={isHostOrManager}
              onAddSubsession={addSubsession}
              onOpenSubsessions={openSubsessions}
              onAssignUserToSubsession={assignUserToSubsession}
              onMoveUserToSubsession={moveUserToSubsession}
              onMoveBackToMainSession={moveUserBackToMainSession}
            />
          )}
        </DraggableModal>
      )}
      {invitedToJoin && (
        <DraggableModal
          title={invitedToJoin.backMainSession ? 'Back to Main session' : 'Join Subsession'}
          visible={inviteVisible}
          onClose={() => {
            setInviteVisible(false);
          }}
          okText="Join"
          cancelText="Not now"
          onOk={() => {
            if (invitedToJoin.backMainSession) {
              subsessionClient.leaveSubsession();
            } else {
              subsessionClient?.joinSubsession(invitedToJoin.subsessionId);
            }
            setInviteVisible(false);
            setInviteAccepted(true);
          }}
          onCancel={() => {
            setInviteVisible(false);
          }}
          width={400}
        >
          {invitedToJoin.backMainSession
            ? `The host(${invitedToJoin.inviterName}) is inviting you to return to main session`
            : `You have been assigned to ${invitedToJoin.subsessionName}.`}
        </DraggableModal>
      )}
      {!isHostOrManager && subsessionRemainingTitle && <div className="room-remaining">{subsessionRemainingTitle}</div>}
      {!isHostOrManager && closingCountdown >= 0 && (
        <DraggableModal
          title="Subsessions"
          visible={closingModalVisible}
          onClose={() => {
            setClosingModalVisible(false);
          }}
          okText="Return to Main Session"
          onOk={() => {
            subsessionClient?.leaveSubsession();
            setClosingModalVisible(false);
          }}
          cancelText="Cancel"
          onCancel={() => {
            setClosingModalVisible(false);
          }}
        >
          <p style={{ fontWeight: 700 }}> Subsessions will close in {closingCountdown} seconds</p>
          <p>You will be returned to the main session automatically.</p>
        </DraggableModal>
      )}
    </div>
  );
};

export default SubsessionContainer;
