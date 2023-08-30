const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
require("dotenv").config();
const app = express();

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

const uri = process.env.MONGODB_URI;

mongoose
  .connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((error) => {
    console.log("Error connecting to MongoDB:", error);
  });

const itemsSchema = {
  name: String,
};
const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your todolist!",
});
const item2 = new Item({
  name: "Hit the + button to add new item.",
});
const item3 = new Item({
  name: "<-- Hit this to delete an item.!",
});

defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema],
};

const List = mongoose.model("List", listSchema);

app.get("/", function (req, res) {
  Item.find({})
    .then(function (foundItems) {
      if (foundItems.length === 0) {
        return Item.insertMany([item1, item2, item3]);
      } else {
        console.log(foundItems);
        return foundItems;
      }
    })
    .then(function (foundItems) {
      res.render("list", { listTitle: "Today", newListItems: foundItems });
    })
    .catch(function (error) {
      console.log(error);
    });
});

app.get("/:customListName", function (req, res) {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({ name: customListName })
    .then(function (foundList) {
      if (foundList) {
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items,
        });
      } else {
        const list = new List({
          name: customListName,
          items: defaultItems,
        });

        return list.save().then(function () {
          res.redirect("/" + customListName);
        });
      }
    })
    .catch(function (err) {
      console.log(err);
    });
});

app.post("/", async function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item({
    name: itemName,
  });

  if (listName === "Today") {
    try {
      await item.save();
      res.redirect("/");
    } catch (error) {
      console.log(error);
    }
  } else {
    try {
      const foundList = await List.findOne({ name: listName });
      foundList.items.push(item);
      await foundList.save();
      res.redirect("/" + listName);
    } catch (error) {
      console.log(error);
    }
  }
});

app.post("/delete", async function (req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    try {
      await Item.findByIdAndRemove(checkedItemId);
      res.redirect("/");
    } catch (error) {
      console.log(error);
    }
  } else {
    try {
      await List.findOneAndUpdate(
        { name: listName },
        { $pull: { items: { _id: checkedItemId } } }
      );
      res.redirect("/" + listName);
    } catch (error) {
      console.log(error);
    }
  }
});

const port = process.env.PORT || 3000;

app.listen(port, function () {});
