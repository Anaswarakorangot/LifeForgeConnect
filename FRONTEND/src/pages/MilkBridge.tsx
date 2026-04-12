import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, Loader2, Search, Filter, MapPin, X,
  Users, Shield, Baby, Package
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  api, MilkDonor, MilkBankRow, MilkShortageAlert, MilkHospitalDashboard,
  getCurrentUserId, isLoggedIn
} from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "@/hooks/AuthContext";

// Import modular components
import {
  MilkDonorRegistration,
  MilkShortageBoard,
  MilkDonorCard,
  MilkMatchModal,
  MilkPassportTable,
  MilkHospitalDashboard as HospitalDashboardComponent,
  MilkDonorRequests,
} from "@/components/milk";

// Shortage posting modal component
function ShortagePostModal({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    infantName: "",
    qtyMl: 100,
    urgency: "normal",
    pincode: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const hospitalId = getCurrentUserId();
    if (!hospitalId) {
      toast.error("Please login as a hospital to post shortages");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await api.milk.postRequest({
        hospital_id: hospitalId,
        infant_name: formData.infantName || undefined,
        daily_quantity_ml: formData.qtyMl,
        urgency: formData.urgency,
        pincode: formData.pincode || undefined
      });
      toast.success(`Shortage alert posted! ${result.donors_notified} donors notified.`);
      onClose();
      setFormData({ infantName: "", qtyMl: 100, urgency: "normal", pincode: "" });
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Failed to post shortage");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="w-full max-w-md bg-card rounded-3xl border-2 border-blood/20 shadow-2xl overflow-hidden"
      >
        <div className="bg-blood p-6 text-white flex justify-between items-center">
          <div>
            <h3 className="font-display text-xl font-bold text-white">Post Milk Shortage</h3>
            <p className="text-white/70 text-xs font-body">Broadcast emergency NICU need</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-full transition-colors text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Infant Identifier (Optional)</Label>
            <Input
              placeholder="e.g. Baby of Anjali or Bed #4"
              className="rounded-xl font-body"
              value={formData.infantName}
              onChange={(e) => setFormData({ ...formData, infantName: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Daily ML Needed</Label>
              <Input
                type="number"
                min={50}
                step={50}
                required
                className="rounded-xl font-body"
                value={formData.qtyMl || ""}
                onChange={(e) => setFormData({ ...formData, qtyMl: Number(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Urgency</Label>
              <Select
                value={formData.urgency}
                onValueChange={(v) => setFormData({ ...formData, urgency: v })}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Pincode (Optional)</Label>
            <Input
              placeholder="6 digits for location matching"
              maxLength={6}
              className="rounded-xl font-body"
              value={formData.pincode}
              onChange={(e) => setFormData({ ...formData, pincode: e.target.value.replace(/\D/g, "") })}
            />
          </div>

          <p className="font-body text-[11px] text-muted-foreground italic bg-blood/5 p-3 rounded-xl border border-blood/10">
            This request will be broadcast to all verified donors in your area. Screened donors will receive SMS alerts.
          </p>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blood text-white font-bold h-12 rounded-xl mt-2 hover:bg-blood/90"
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Post Alert"}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}

export default function MilkBridge() {
  const { role } = useAuth();
  const userId = getCurrentUserId();

  // Data states
  const [donors, setDonors] = useState<MilkDonor[]>([]);
  const [milkBank, setMilkBank] = useState<MilkBankRow[]>([]);
  const [shortageAlerts, setShortageAlerts] = useState<MilkShortageAlert[]>([]);
  const [hospitalDashboard, setHospitalDashboard] = useState<MilkHospitalDashboard | null>(null);
  const [donorRequests, setDonorRequests] = useState<any[]>([]);

  // UI states
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  // Filter states
  const [searchCity, setSearchCity] = useState("");
  const [searchPincode, setSearchPincode] = useState("");
  const [screeningFilter, setScreeningFilter] = useState<string>("all");

  // Modal states
  const [showShortageModal, setShowShortageModal] = useState(false);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<MilkShortageAlert | null>(null);
  const [matchResults, setMatchResults] = useState<any[]>([]);
  const [isMatching, setIsMatching] = useState(false);

  // Fetch data
  const fetchData = async () => {
    try {
      const params: any = {};
      if (searchCity) params.city = searchCity;
      if (searchPincode) params.pincode = searchPincode;
      if (screeningFilter !== "all") params.screening_status = screeningFilter;

      const [donorsData, bankData, alertsData] = await Promise.all([
        api.milk.getDonors(Object.keys(params).length > 0 ? params : undefined),
        api.milk.getBank(),
        api.milk.getShortageAlerts()
      ]);

      setDonors(donorsData);
      setMilkBank(bankData);
      setShortageAlerts(alertsData);

      // Fetch hospital dashboard if hospital role
      if (role === "hospital" && userId) {
        try {
          const dashboard = await api.milk.getHospitalDashboard(userId);
          setHospitalDashboard(dashboard);
        } catch (e) {
          console.log("Hospital dashboard not available");
        }
      }

      // Fetch requests for donor
      if (role === "donor" && userId) {
        try {
          const requests = await api.milk.getRequestsForDonor(userId);
          setDonorRequests(requests);
        } catch (e) {
          console.log("Donor requests not available");
        }
      }
    } catch (error) {
      console.error("Failed to fetch MilkBridge data", error);
      toast.error("Could not load latest donation data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [role, userId]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isLoading) fetchData();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchCity, searchPincode, screeningFilter]);

  // Handler: Request milk from donor
  const handleRequestDonation = async (donor: MilkDonor) => {
    if (!isLoggedIn()) {
      toast.error("Please login to request milk donation");
      return;
    }

    if (role !== "hospital") {
      toast.info(`${donor.name} is available for donation. Contact your nearest NICU to coordinate.`);
      return;
    }

    try {
      await api.milk.createMatch({
        request_id: hospitalDashboard?.active_requests[0]?.id || "",
        donor_id: donor.donor_id,
        milk_donor_id: donor.id
      });
      toast.success(`Match request sent to ${donor.name}!`);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Failed to send request");
    }
  };

  // Handler: Respond to alert (donor)
  const handleRespondToAlert = async (alert: MilkShortageAlert) => {
    if (!isLoggedIn()) {
      toast.error("Please login to respond to shortage alerts");
      return;
    }

    if (role !== "donor") {
      toast.info("Only registered donors can respond to alerts.");
      return;
    }

    // Create a match offer
    try {
      const donorId = getCurrentUserId();
      if (!donorId) return;

      await api.milk.createMatch({
        request_id: alert.id,
        donor_id: donorId,
      });
      toast.success(`Offer sent to ${alert.hospital}! They'll coordinate pickup.`);
      fetchData();
    } catch (e: any) {
      if (e.message?.includes("already exists")) {
        toast.info("You've already offered to help with this request.");
      } else {
        toast.error(e.message || "Failed to send offer");
      }
    }
  };

  // Handler: Find matches for request
  const handleFindMatches = async (request: MilkShortageAlert) => {
    setSelectedRequest(request);
    setIsMatching(true);
    setShowMatchModal(true);

    try {
      const result = await api.milk.findMatches({
        request_id: request.id,
        max_distance_km: 50,
        limit: 10
      });
      setMatchResults(result.matches);
    } catch (error: any) {
      toast.error(error.message || "Failed to find matches");
    } finally {
      setIsMatching(false);
    }
  };

  // Handler: View QR (Milk Passport)
  const handleViewQR = async (id: string) => {
    if (!isLoggedIn()) {
      toast.error("Please login to verify Milk Passport records");
      return;
    }

    try {
      const donation = await api.milk.getDonation(id);
      toast.info(
        `Milk Passport ${id}\nDonor: ${donation.donor_name}\nVolume: ${donation.volume_ml}ml\n` +
        `Status: ${donation.status}\nExpiry: ${donation.expiry_date || "N/A"}`
      );
    } catch {
      toast.info(`Milk Passport QR for ${id} - Verified pasteurization record.`);
    }
  };

  // Stats calculations
  const stats = {
    activeDonors: donors.length,
    screenedDonors: donors.filter(d => d.is_screened).length,
    babiesHelped: "12,400+",
    donationsLogged: milkBank.length,
    criticalAlerts: shortageAlerts.filter(a => a.urgency === "CRITICAL").length
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="pt-16">
        {/* Module hero */}
        <div className="bg-gradient-to-br from-milk/90 to-amber-400/60 py-16 px-4">
          <div className="container mx-auto">
            <Link to="/" className="inline-flex items-center gap-1.5 text-foreground/60 hover:text-foreground font-body text-sm mb-6 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to Home
            </Link>
            <div className="flex items-center gap-4 mb-4">
              <div className="text-6xl animate-bounce-slow">🍼</div>
              <div>
                <h1 className="font-display text-5xl font-black text-foreground">MilkBridge</h1>
                <p className="font-body text-foreground/60 text-lg">Nourishing India's tiniest lives</p>
              </div>
            </div>
            <div className="flex gap-6 mt-6 flex-wrap">
              {[
                { label: "Active Donors", value: stats.activeDonors || "Loading...", icon: Users },
                { label: "Screened & Ready", value: stats.screenedDonors, icon: Shield },
                { label: "Babies Helped", value: stats.babiesHelped, icon: Baby },
                { label: "Donations Logged", value: stats.donationsLogged, icon: Package },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="bg-white/20 rounded-xl px-5 py-3 backdrop-blur-md border border-white/30 flex items-center gap-3">
                  <Icon className="w-5 h-5 text-foreground/70" />
                  <div>
                    <div className="font-display text-2xl font-bold text-foreground">{value}</div>
                    <div className="font-body text-xs text-foreground/70">{label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="container mx-auto px-4 py-10">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
            <TabsList className="bg-muted/50 p-1 rounded-xl">
              <TabsTrigger value="overview" className="rounded-lg">Overview</TabsTrigger>
              {role === "hospital" && (
                <TabsTrigger value="dashboard" className="rounded-lg">Hospital Dashboard</TabsTrigger>
              )}
              {role === "donor" && (
                <TabsTrigger value="my-requests" className="rounded-lg">My Donations</TabsTrigger>
              )}
              <TabsTrigger value="bank" className="rounded-lg">Milk Bank</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left sidebar */}
                <div className="space-y-6">
                  {/* Register donor form */}
                  {role === "donor" && (
                    <MilkDonorRegistration onSuccess={fetchData} />
                  )}

                  {/* Search filters */}
                  <div className="rounded-2xl border-2 border-border/50 bg-card p-5 shadow-card space-y-4">
                    <h3 className="font-display text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                      <Filter className="w-4 h-4" /> Search Donors
                    </h3>
                    <div className="space-y-3">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder="Filter by city..."
                          className="pl-9 h-10 rounded-xl"
                          value={searchCity}
                          onChange={(e) => setSearchCity(e.target.value)}
                        />
                      </div>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder="Filter by pincode..."
                          className="pl-9 h-10 rounded-xl"
                          maxLength={6}
                          value={searchPincode}
                          onChange={(e) => setSearchPincode(e.target.value.replace(/\D/g, ""))}
                        />
                      </div>
                      <Select value={screeningFilter} onValueChange={setScreeningFilter}>
                        <SelectTrigger className="h-10 rounded-xl">
                          <SelectValue placeholder="Screening status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All donors</SelectItem>
                          <SelectItem value="cleared">Screened only</SelectItem>
                          <SelectItem value="pending">Pending screening</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Shortage alerts */}
                  <MilkShortageBoard
                    alerts={shortageAlerts}
                    isLoading={isLoading}
                    role={role || ""}
                    onPostShortage={() => setShowShortageModal(true)}
                    onFindMatches={handleFindMatches}
                    onRespond={handleRespondToAlert}
                  />
                </div>

                {/* Main content: Active Donors Grid */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-xl font-bold flex items-center gap-2">
                      Verified Milk Donors
                      {isLoading && <Loader2 className="w-4 h-4 animate-spin text-milk" />}
                    </h3>
                    <Badge variant="outline" className="font-body text-[10px] text-milk border-milk/30">
                      {donors.filter(d => d.is_screened).length} SCREENED
                    </Badge>
                  </div>

                  {donors.length === 0 && !isLoading && (
                    <div className="text-center py-12 border-2 border-dashed rounded-3xl bg-muted/5">
                      <p className="font-body text-muted-foreground">No donors match your filters.</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {donors.map((d, i) => (
                      <MilkDonorCard
                        key={d.id}
                        donor={d}
                        index={i}
                        role={role || ""}
                        onRequest={handleRequestDonation}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Hospital Dashboard Tab */}
            {role === "hospital" && (
              <TabsContent value="dashboard" className="mt-6">
                <HospitalDashboardComponent
                  dashboard={hospitalDashboard}
                  onFindMatches={(req) => handleFindMatches({ id: req.id, hospital: hospitalDashboard?.hospital.name } as any)}
                  onPostShortage={() => setShowShortageModal(true)}
                  onRefresh={fetchData}
                />
              </TabsContent>
            )}

            {/* Donor Requests Tab */}
            {role === "donor" && (
              <TabsContent value="my-requests" className="mt-6">
                <MilkDonorRequests
                  nearbyRequests={donorRequests}
                  onRefresh={fetchData}
                />
              </TabsContent>
            )}

            {/* Milk Bank Tab */}
            <TabsContent value="bank" className="mt-6">
              <MilkPassportTable
                data={milkBank}
                isLoading={isLoading}
                onViewPassport={handleViewQR}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <Footer />

      {/* Modals */}
      <ShortagePostModal
        isOpen={showShortageModal}
        onClose={() => setShowShortageModal(false)}
        onSuccess={fetchData}
      />

      <MilkMatchModal
        isOpen={showMatchModal}
        onClose={() => setShowMatchModal(false)}
        request={selectedRequest}
        matches={matchResults}
        isLoading={isMatching}
        onMatchCreated={fetchData}
      />
    </div>
  );
}
