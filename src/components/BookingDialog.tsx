"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { Modal, DatePicker, Button, Space, Divider, Typography, Select, Input, Form, message } from "antd";
import dayjs, { Dayjs } from "dayjs";

type MinimalService = { id: string; name: string; durations: number[] };
type BookingDialogProps = {
  open: boolean;
  service: MinimalService;
  defaultDuration: number;
  onClose: () => void;
  onConfirm?: (p: {
    serviceId: string;
    serviceName: string;
    customerName: string;
    phone: string;
    durationMin: number;
    startsAtISO: string;
  }) => void;
};

const OPEN_HOUR = 9;
const CLOSE_HOUR = 19;
const STEP_MIN = 30;

type Slot = { label: string; value: string; date: Dayjs };
type Groups = Record<"Reggel" | "Nap" | "Este", Slot[]>;

function generateSlots(d: Dayjs): Groups {
  const start = d.hour(OPEN_HOUR).minute(0).second(0).millisecond(0);
  const end   = d.hour(CLOSE_HOUR).minute(0).second(0).millisecond(0);
  const groups: Groups = { Reggel: [], Nap: [], Este: [] };
  for (let t = start.clone(); t.isBefore(end); t = t.add(STEP_MIN, "minute")) {
    const slot: Slot = { label: t.format("HH:mm"), value: t.toISOString(), date: t };
    const h = t.hour();
    if (h < 12) groups.Reggel.push(slot);
    else if (h < 17) groups.Nap.push(slot);
    else groups.Este.push(slot);
  }
  return groups;
}

export default function BookingDialog(props: BookingDialogProps) {
  const { open, service, defaultDuration, onClose, onConfirm } = props;
  const [form] = Form.useForm();
  const [date, setDate] = useState<Dayjs>(dayjs());
  const [pickedISO, setPickedISO] = useState<string | null>(null);
  const [duration, setDuration] = useState<number>(defaultDuration);

  const groups = useMemo(() => generateSlots(date.startOf("day")), [date]);

  const isDisabled = (slot: Slot) => slot.date.isBefore(dayjs());

  const submit = async () => {
    try {
      const vals = await form.validateFields();
      if (!pickedISO) return message.warning("Válassz időpontot!");
      onConfirm?.({
        serviceId: service.id,
        serviceName: service.name,
        customerName: vals.name,
        phone: vals.phone,
        durationMin: duration,
        startsAtISO: pickedISO,
      });
      message.success("Foglalás adatai rögzítve (demo).");
      onClose();
    } catch {}
  };

  // --- ÚJ: dinamikus footer-magasság → body padding
  const footerRef = useRef<HTMLDivElement>(null);
  const [footerH, setFooterH] = useState(76);
  useEffect(() => {
    if (!footerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      const h = entries[0].contentRect.height;
      setFooterH(Math.ceil(h));
    });
    ro.observe(footerRef.current);
    return () => ro.disconnect();
  }, []);

  return (
    <Modal
      open={open}
      onCancel={onClose}
      // MOST: a gombsor a footerben van, nem a body-ban
      footer={
        <div ref={footerRef} className="flex justify-end gap-3">
          <Button onClick={onClose}>Mégse</Button>
          <Button type="primary" onClick={submit}>Foglalás megerősítése</Button>
        </div>
      }
      width={680}
      rootClassName="booking-modal"
      styles={{
        header: { marginBottom: 8 },
        // a body alja kap annyi helyet, amekkora a footer ( + safe-area )
        body: { paddingBottom: footerH + 12 },
      }}
      title={
        <div className="flex flex-col gap-1">
          <span className="font-semibold">{service.name}</span>
          <span className="text-sm" style={{ color: "var(--color-muted)" }}>
            Válassz időpontot és add meg az adataid
          </span>
        </div>
      }
    >
      {/* mobil finomhangolás */}
      <style jsx global>{`
        .booking-modal .ant-modal { max-width: 680px; }
        @media (max-width: 640px) {
          .booking-modal .ant-modal { width: 100vw !important; max-width: 100vw !important; margin: 0; top: 0; padding: 0; }
          .booking-modal .ant-modal-content { height: 100vh; border-radius: 0; display: flex; flex-direction: column; }
          .booking-modal .ant-modal-header { padding: 12px 14px; }
          .booking-modal .ant-modal-body { flex: 1; overflow: auto; padding: 12px 12px calc(12px + env(safe-area-inset-bottom)); }
          .booking-modal .ant-modal-footer {
            position: sticky; bottom: 0; z-index: 1;
            background: #fff; border-top: 1px solid var(--color-line);
            padding-bottom: calc(16px + env(safe-area-inset-bottom));
          }
          .booking-modal .time-pill.ant-btn { padding: 0 12px; height: 36px; font-size: 14px; }
        }
      `}</style>

      {/* --- űrlap és időpontok: változatlan --- */}
      <Form form={form} layout="vertical" requiredMark={false}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Form.Item name="name" label="Név" rules={[{ required: true, message: "Add meg a neved!" }]}>
            <Input placeholder="Pl. Kovács Anna" />
          </Form.Item>
          <Form.Item
            name="phone"
            label="Telefon"
            rules={[
              { required: true, message: "Add meg a telefonszámod!" },
              { pattern: /^[0-9+\-\s()]{6,}$/, message: "Érvénytelen telefonszám" },
            ]}
          >
            <Input placeholder="+36 30 123 4567" />
          </Form.Item>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-2">
          <div>
            <div className="text-sm" style={{ color: "var(--color-muted)" }}>Dátum</div>
            <DatePicker
              value={date}
              onChange={(v) => { if (!v) return; setDate(v); setPickedISO(null); }}
              disabledDate={(d) => d && d.startOf("day").isBefore(dayjs().startOf("day"))}
              style={{ width: "100%" }}
            />
          </div>
          <div>
            <div className="text-sm" style={{ color: "var(--color-muted)" }}>Szolgáltatási idő</div>
            <Select
              value={duration}
              onChange={setDuration}
              options={service.durations.map((m) => ({ value: m, label: `${m} perc` }))}
              style={{ width: "100%" }}
            />
          </div>
        </div>

        {(["Reggel", "Nap", "Este"] as const).map((k) => (
          <div key={k} style={{ marginBottom: 8 }}>
            <Typography.Text type="secondary" style={{ marginLeft: 4 }}>{k}</Typography.Text>
            <div style={{ marginTop: 8 }}>
              <Space size={[10, 10]} wrap>
                {groups[k].map((slot) => {
                  const disabled = isDisabled(slot);
                  const active = pickedISO === slot.value;
                  return (
                    <Button
                      key={slot.value}
                      className="time-pill"
                      type={active ? "primary" : "default"}
                      shape="round"
                      size="large"
                      disabled={disabled}
                      onClick={() => !disabled && setPickedISO(slot.value)}
                    >
                      {slot.label}
                    </Button>
                  );
                })}
              </Space>
            </div>
            <Divider style={{ margin: "14px 0" }} />
          </div>
        ))}
      </Form>
    </Modal>
  );
}