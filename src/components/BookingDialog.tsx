"use client";

import { useMemo, useState, useEffect } from "react";
import {
  Modal,
  DatePicker,
  Button,
  Space,
  Divider,
  Typography,
  Select,
  Input,
  Form,
  message,
} from "antd";
import dayjs, { Dayjs } from "dayjs";
import { OPEN_HOUR, STEP_MIN, DAY_SLOTS, hhmmFromIndex } from "@/lib/booking";
import { fmtHUF } from "@/lib/pricing";
import StaffPicker, { Staff } from "@/components/StaffPicker";
import { motion, AnimatePresence } from "framer-motion";


type BookingPayload = {
  staffId: string;
  staffName: string;
  date: string;
  startIndex: number;
  durationMin: number;
  serviceId: string;
  serviceName: string;
  customerName: string;
  phone: string;
  email?: string;
};

type MinimalService = {
  id: string;
  name: string;
  durations: number[];
};

export default function BookingDialog({
  open,
  service,
  defaultDuration,
  onClose,
  onConfirm,
  pricesByDuration,
}: {
  open: boolean;
  service: MinimalService;
  defaultDuration: number;
  onClose: () => void;
  onConfirm?: (payload: BookingPayload) => void;
  pricesByDuration?: Record<number, number>;
}) {
  const [form] = Form.useForm();
  const [date, setDate] = useState<Dayjs>(dayjs());
  const [duration, setDuration] = useState<number>(defaultDuration);
  const [pickedIndex, setPickedIndex] = useState<number | null>(null);
  const [disabledStarts, setDisabledStarts] = useState<number[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [pickedStaff, setPickedStaff] = useState<Staff | null>(null);

  const dateKey = date.format("YYYY-MM-DD");

  // ár a katalógusból, fallback ha nincs
  const price = useMemo(() => {
    return pricesByDuration?.[duration] ?? 0;
  }, [duration, pricesByDuration]);

  const starts = useMemo(
    () => Array.from({ length: DAY_SLOTS }, (_, i) => ({ i, label: hhmmFromIndex(i) })),
    []
  );

  useEffect(() => {
    if (open) {
      setSubmitted(false);
      setPickedStaff(null);
    }
  }, [open]);


  // elérhetőség lekérés
  useEffect(() => {
    (async () => {
      setPickedIndex(null);
      if (!pickedStaff) { setDisabledStarts([]); return; }

      const r = await fetch(
          `/api/book/availability?date=${dateKey}&duration=${duration}&staffId=${pickedStaff.id}`,
        { cache: "no-store" }
      );
      const j = await r.json();
      if (j.ok) setDisabledStarts(j.disabled as number[]);
      else setDisabledStarts([]);
    })();
  }, [dateKey, duration, pickedStaff?.id]);

  // aznapi múltbeli slotok tiltása
  const disabledWithPast = useMemo(() => {
    if (!date.isSame(dayjs(), "day")) return disabledStarts;
    const now = dayjs();
    const minutesFromOpen = now.hour() * 60 + now.minute() - OPEN_HOUR * 60;
    const nowIndex = Math.floor(Math.max(0, minutesFromOpen) / STEP_MIN);
    const extra = starts.filter((s) => s.i <= nowIndex).map((s) => s.i);
    return Array.from(new Set([...disabledStarts, ...extra]));
  }, [disabledStarts, date, starts]);

  const submit = async () => {
    try {
      const vals = await form.validateFields();
      if (pickedIndex == null) return message.warning("Válassz időpontot!");
      if (!pickedStaff) return message.warning("Válassz masszőrt!");

      const payload = {
        staffId: pickedStaff.id,
        staffName: pickedStaff.name,
        date: dateKey,
        startIndex: pickedIndex,
        durationMin: duration,
        serviceId: service.id,
        serviceName: service.name,
        customerName: vals.name as string,
        phone: vals.phone as string,
        email: vals.email as string | undefined,
      };

      const r = await fetch("/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await r.json();

      if (!j.ok) {
        if (r.status === 409)
          return message.error("Sajnos közben elfogyott ez az időpont.");
        return message.error("Nem sikerült lefoglalni. Próbáld újra.");
      }

      message.success("Köszönjük, foglalását megkaptuk.");

      if (onConfirm) onConfirm(payload);

      setSubmitted(true);  
      form.resetFields();
      setPickedIndex(null);
    } catch {
      /* no-op */
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={submitted ? "Foglalás elküldve" : service.name}
      onOk={submitted ? undefined : submit}
      okText={
        submitted
          ? "Bezárás"
          : !pickedStaff
            ? "Válassz masszőrt"
            : `Foglalás megerősítése – ${fmtHUF(price)}`
      }
      closable={!submitted}
      footer={
        submitted
          ? [
              <Button
                key="close"
                type="primary"
                onClick={() => {
                  setSubmitted(false);
                  onClose();
                }}
              >
                Bezárás
              </Button>,
            ]
          : undefined // ilyenkor a default OK/Cancel + onOk/okText érvényes
      }
    >
      {submitted ? (
        <div className="space-y-2 text-sm">
          <p><b>Köszönjük, foglalását megkaptuk!</b></p>
          <p>
            A megadott elérhetőségeid egyikére rövidesen visszaigazolást küldünk.
            Ha nem érkezik e-mail, kérjük ellenőrizd a spam mappát is.
          </p>
        </div>
      ) : (
        <Form form={form} layout="vertical" requiredMark={false}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Form.Item
              name="name"
              label="Név"
              rules={[{ required: true, message: "Kötelező" }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="phone"
              label="Telefon"
              rules={[{ required: true, message: "Kötelező" }]}
            >
              <Input />
            </Form.Item>
          </div>

          <Form.Item
            name="email"
            label="E-mail (visszaigazoláshoz)"
            rules={[{ type: "email", message: "Érvénytelen e-mail" }]}
          >
            <Input />
          </Form.Item>

          <StaffPicker value={pickedStaff} onChange={setPickedStaff} />

          <AnimatePresence initial={false}>
            {pickedStaff && (
              <motion.div
                key="booking-rest"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.22 }}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-2">
                  <div>
                    <div className="text-sm text-[var(--color-muted)]">Dátum</div>
                    <DatePicker
                      value={date}
                      onChange={(v) => v && setDate(v)}
                      disabledDate={(d) =>
                        d && d.startOf("day").isBefore(dayjs().startOf("day"))
                      }
                      style={{ width: "100%" }}
                    />
                  </div>

                  <div>
                    <div className="text-sm text-[var(--color-muted)]">
                      Szolgáltatási idő
                    </div>
                    <Select
                      value={duration}
                      onChange={setDuration}
                      options={service.durations.map((m) => ({
                        value: m,
                        label: `${m} perc`,
                      }))}
                      style={{ width: "100%" }}
                    />
                    <div className="mt-2 text-sm">
                      Végösszeg: <b>{fmtHUF(price)}</b>
                    </div>
                  </div>
                </div>

                {(["Reggel", "Nap", "Este"] as const).map((group) => {
                  const rng =
                    group === "Reggel" ? [0, 6] : group === "Nap" ? [6, 16] : [16, DAY_SLOTS];
                  return (
                    <div key={group} style={{ marginBottom: 8 }}>
                      <Typography.Text type="secondary" style={{ marginLeft: 4 }}>
                        {group}
                      </Typography.Text>
                      <div style={{ marginTop: 8 }}>
                        <Space size={[10, 10]} wrap>
                          {starts.slice(rng[0], rng[1]).map(({ i, label }) => {
                            const disabled = disabledWithPast.includes(i);
                            const active = pickedIndex === i;
                            return (
                              <Button
                                key={i}
                                type={active ? "primary" : "default"}
                                shape="round"
                                disabled={disabled}
                                onClick={() => !disabled && setPickedIndex(i)}
                              >
                                {label}
                              </Button>
                            );
                          })}
                        </Space>
                      </div>
                      <Divider style={{ margin: "14px 0" }} />
                    </div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>

          {!pickedStaff && (
            <div className="mt-16 text-sm text-[var(--color-muted)]">
              Először válassz masszőrt az időpontok megjelenítéséhez.
            </div>
          )}

        </Form>
      )}
    </Modal>
  );
}
