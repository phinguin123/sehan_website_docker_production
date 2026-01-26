import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Pencil, Trash2 } from "lucide-react";
import instance from "@/apis/axiosInstance";

export default function AdminParentSettingsPage() {
  const [parents, setParents] = useState([]);
  const [newParent, setNewParent] = useState({
    parent_id: null,
    parent_name: "",
    email: "",
    password: "",
    phone: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    isOpen: false,
    parentId: null,
  });

  useEffect(() => {
    fetchParentList();
  }, []);

  const fetchParentList = async () => {
    try {
      const response = await instance.get("/api/parents");
      console.log("received parent list response:", response.data);

      setParents(response.data);
    } catch (error) {
      console.error("Error fetching parent list:", error);
    }
    // Simulated API call
  };

  const handleInputChange = (e) => {
    setNewParent({ ...newParent, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newParent.parent_name || !newParent.email) {
      alert("Name and email are required fields.");
      return;
    }

    // Simulated API call
    if (isEditing) {
      try {
        await instance.put("/api/parents", newParent);
        setParents(
          parents.map((parent) =>
            parent.parent_id === newParent.parent_id ? newParent : parent
          )
        );
        alert("Parent updated successfully.");
      } catch (error) {
        if (error.response) {
          alert(error.response.data.message);
        }
        console.error("Error updating parent:", error);
        return;
      }
    } else {
      try {
        const response = await instance.post("/api/parents", newParent);
        alert("New parent added successfully.");
      } catch (error) {
        if (error.response) {
          alert(error.response.data.message);
        }
        console.error("Error adding new parent:", error);
        return;
      }

      fetchParentList();
    }

    setNewParent({
      parent_id: null,
      parent_name: "",
      email: "",
      password: "",
      phone: "",
    });
    setIsEditing(false);
  };

  const handleEdit = (parent) => {
    setNewParent({ ...parent, password: "" });
    setIsEditing(true);

    window.scrollTo(0, 0);
  };

  const handleDeleteConfirmation = async (id) => {
    setDeleteConfirmation({ isOpen: true, parentId: id });
  };

  const handleDelete = async () => {
    if (deleteConfirmation.parentId) {
      try {
        await instance.delete(`/api/parents/${deleteConfirmation.parentId}`);
        setParents(
          parents.filter(
            (parent) => parent.parent_id !== deleteConfirmation.parentId
          )
        );
        window.alert("Parent deleted successfully.");
      } catch (error) {
        if (error.response) {
          alert(error.response.data.message);
        }
      } finally {
        setDeleteConfirmation({ isOpen: false, parentId: null });
      }
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Parent Management</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>
              {isEditing ? "Edit Parent" : "Add New Parent"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="parent_name"
                  name="parent_name"
                  value={newParent.parent_name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={newParent.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={newParent.password}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Phone Number</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="number"
                  value={newParent.phone}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <Button type="submit">
                {isEditing ? "Update Parent" : "Add Parent"}
              </Button>
              {isEditing && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setNewParent({
                      parent_id: null,
                      parent_name: "",
                      email: "",
                      password: "",
                      phone: "",
                    });
                    setIsEditing(false);
                  }}
                >
                  Cancel Edit
                </Button>
              )}
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Current Parents</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Password</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parents?.filter(parent => parent && parent.parent_id).map((parent) => (
                  <TableRow key={parent.parent_id}>
                    <TableCell>{parent.parent_name || 'N/A'}</TableCell>
                    <TableCell>{parent.email || 'N/A'}</TableCell>
                    <TableCell>{parent.password || 'N/A'}</TableCell>
                    <TableCell>{parent.phone || 'N/A'}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleEdit(parent)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() =>
                            handleDeleteConfirmation(parent.parent_id)
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      <Dialog
        open={deleteConfirmation.isOpen}
        onOpenChange={(isOpen) =>
          setDeleteConfirmation({ ...deleteConfirmation, isOpen })
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this parent? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setDeleteConfirmation({ isOpen: false, parentId: null })
              }
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
